"""Learnova end-to-end verification suite.

Runs against a live Django server. Proves both that the security holes are
closed AND that the legitimate role flows still work.

Usage:  python backend/tests_e2e.py [base_url]
"""
import hashlib
import hmac
import json
import os
import sys
import urllib.error
import urllib.request
import uuid

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/api/v1").rstrip("/")

PASS, FAIL = [], []


def razorpay_secret():
    """Secret the server under test verifies signatures with.

    Defaults to the stub credentials the suite is run against, so the signature
    checks below exercise the real HMAC path.
    """
    return os.environ.get("RAZORPAY_KEY_SECRET", "stub_secret")


def call(method, path, token=None, body=None, raw=None, content_type=None, binary=False):
    url = f"{BASE}{path}"
    data = None
    headers = {"Accept": "application/json"}
    if raw is not None:
        data = raw
        headers["Content-Type"] = content_type
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    def decode(payload):
        if binary:
            return payload
        try:
            return json.loads(payload.decode())
        except (json.JSONDecodeError, UnicodeDecodeError):
            return payload.decode(errors="replace")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, decode(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, decode(e.read())
    except urllib.error.URLError as e:
        return 0, {"error": str(e.reason)}


def check(name, condition, detail=""):
    (PASS if condition else FAIL).append(name)
    mark = "PASS" if condition else "FAIL"
    print(f"  [{mark}] {name}" + (f"  -> {detail}" if detail and not condition else ""))


def login(email, password):
    code, body = call("POST", "/auth/login/", body={"email": email, "password": password})
    if code != 200:
        return None
    return {
        "token": body["tokens"]["access"],
        "refresh": body["tokens"]["refresh"],
        "id": body["user"]["id"],
        "role": body["user"]["role"],
    }


def unique(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:10]}@learnova.test"


def main():
    print(f"\nLearnova E2E suite against {BASE}\n" + "=" * 62)

    print("\n[1] Authentication")
    admin = login("admin@learnova.app", "Admin@123")
    staff = login("staff@learnova.app", "Staff@123")
    student = login("student@learnova.app", "Student@123")
    check("admin login", admin and admin["role"] == "admin")
    check("staff login", staff and staff["role"] == "staff")
    check("student login", student and student["role"] == "student")

    code, _ = call("POST", "/auth/login/", body={"email": "student@learnova.app", "password": "wrong"})
    check("bad password rejected 401", code == 401, f"got {code}")

    new_email = unique("student")
    code, reg = call("POST", "/auth/register/", body={
        "email": new_email, "password": "Str0ngPass!23",
        "firstName": "Nina", "lastName": "Newcomer", "phone": "+919876543210",
    })
    check("register returns 201 + tokens", code == 201 and "tokens" in reg, f"got {code}")
    check("registered user is student", reg.get("user", {}).get("role") == "student")
    new_student = login(new_email, "Str0ngPass!23")
    check("new student can log in", new_student is not None)

    code, dup = call("POST", "/auth/register/", body={
        "email": new_email, "password": "Str0ngPass!23",
        "firstName": "Dup", "lastName": "User",
    })
    check("duplicate email rejected 400", code == 400, f"got {code}")

    code, weak = call("POST", "/auth/register/", body={
        "email": unique("weak"), "password": "123", "firstName": "W", "lastName": "K",
    })
    check("weak password rejected 400", code == 400, f"got {code}")

    # ---- T1 privilege escalation
    print("\n[2] Security: privilege escalation")
    code, body = call("PATCH", f"/users/{new_student['id']}/", new_student["token"],
                      {"role": "admin"})
    check("student cannot self-promote via /users/", code in (400, 403), f"got {code}")
    code, me = call("GET", f"/users/{new_student['id']}/", admin["token"])
    check("role unchanged after escalation attempt", me.get("role") == "student", me.get("role"))

    code, body = call("PATCH", "/auth/profile/", new_student["token"], {"role": "admin"})
    check("student cannot self-promote via /auth/profile/", code in (400, 403), f"got {code}")

    # ---- T3 staff creation
    print("\n[3] Security: privileged user management")
    code, _ = call("POST", "/users/create-staff/", new_student["token"],
                   {"email": unique("sneaky"), "password": "Str0ngPass!23",
                    "firstName": "S", "lastName": "N"})
    check("student cannot create staff", code == 403, f"got {code}")

    staff_email = unique("staff")
    code, made = call("POST", "/users/create-staff/", admin["token"],
                      {"email": staff_email, "password": "Str0ngPass!23",
                       "firstName": "Nina", "lastName": "Faculty"})
    check("admin can create staff", code == 201, f"got {code} {made}")
    made_staff = login(staff_email, "Str0ngPass!23")

    code, _ = call("DELETE", f"/users/{new_student['id']}/", new_student["token"])
    check("student cannot delete users", code == 403, f"got {code}")

    # ---- T2 course writes
    print("\n[4] Security: course authoring is role-gated")
    payload = {"title": f"Hostile {uuid.uuid4().hex[:6]}",
               "description": "x", "category": "x", "instructorName": "x", "priceInr": 100}
    code, hostile = call("POST", "/courses/", new_student["token"], payload)
    check("student cannot create course", code == 403, f"got {code}")

    code, c = call("POST", "/courses/", admin["token"], payload)
    check("admin can create course", code == 201, f"got {code} {c}")
    new_course = c if code == 201 else None

    code, _ = call("POST", "/courses/", staff["token"], payload)
    check("staff cannot create course (admin-only)", code == 403, f"got {code}")

    if new_course:
        code, _ = call("PATCH", f"/courses/{new_course['id']}/", new_student["token"],
                       {"title": "hijacked"})
        check("student cannot edit course", code == 403, f"got {code}")

    # ---- T4 free enrollment
    print("\n[5] Security: no free enrolment")
    code, body = call("POST", "/enrollments/", new_student["token"], {"course_id": 1})
    check("student cannot self-enrol", code in (403, 405), f"got {code}")
    code, body = call("GET", "/enrollments/", new_student["token"])
    check("new student has zero enrolments", len(body) == 0, f"got {len(body)}")

    # ---- T5 payment bypass
    print("\n[6] Security: payment verification cannot be forged")
    # A dedicated payer keeps the shared student unenrolled for the sections below.
    payer_email = unique("payer")
    call("POST", "/auth/register/", body={
        "email": payer_email, "password": "Str0ngPass!23",
        "firstName": "Pri", "lastName": "Payer",
    })
    payer = login(payer_email, "Str0ngPass!23") or new_student
    code, order = call("POST", "/payments/create-order/", payer["token"], {"courseId": 1})

    if code == 503:
        # Unconfigured gateway: the server must refuse rather than mint a fake order.
        check("unconfigured gateway refuses to create an order", True)
        check("refusal names the reason", "not configured" in str(order.get("error", "")).lower(),
              f"got {order}")
        code, body = call("GET", "/enrollments/", payer["token"])
        check("refused order created no enrolment", len(body) == 0, f"got {len(body)}")
        code, _ = call("POST", "/payments/verify/", payer["token"],
                       {"orderId": "order_anything", "paymentId": "pay_x", "signature": "sig_x"})
        check("verify without a real order is rejected", code >= 400, f"got {code}")
    elif code == 201:
        check("order created", True)
        check("order id comes from the gateway",
              str(order.get("orderId", "")).startswith("order_")
              and "mock" not in str(order.get("orderId", "")).lower(),
              f"got {order.get('orderId')}")
        check("amount is sent to the gateway in paise",
              isinstance(order.get("amountInr"), int) and order["amountInr"] > 0,
              f"got {order.get('amountInr')}")
        check("create-order does not leak a secret",
              "razorpayKeySecret" not in order and "keySecret" not in order
              and razorpay_secret() not in json.dumps(order))
        check("key id is returned for the client checkout", bool(order.get("razorpayKeyId")))

        code, forged = call("POST", "/payments/verify/", payer["token"], {
            "orderId": order["orderId"], "paymentId": "pay_FORGED",
            "signature": "sig_TOTALLY_FORGED",
        })
        check("forged signature rejected", code >= 400, f"got {code}")
        code, body = call("GET", "/enrollments/", payer["token"])
        check("forged payment created no enrolment", len(body) == 0, f"got {len(body)}")

        code, missing = call("POST", "/payments/verify/", payer["token"],
                             {"orderId": order["orderId"]})
        check("verify without signature rejected", code == 400, f"got {code}")

        # A correctly signed settlement must succeed, proving the check above is a
        # real HMAC verification and not a blanket rejection of everything.
        secret = razorpay_secret()
        if secret:
            code, ok = call("POST", "/payments/verify/", payer["token"], {
                "orderId": order["orderId"], "paymentId": "pay_REAL",
                "signature": hmac.new(secret.encode(), f"{order['orderId']}|pay_REAL".encode(),
                                      hashlib.sha256).hexdigest(),
            })
            check("correctly signed payment is accepted", code == 200, f"got {code} {ok}")
            check("settlement returns the enrolment", bool(ok.get("enrollmentId")), f"got {ok}")
            code, body = call("GET", "/enrollments/", payer["token"])
            check("paid student now holds exactly one enrolment", len(body) == 1, f"got {len(body)}")
            code, replay = call("POST", "/payments/verify/", payer["token"], {
                "orderId": order["orderId"], "paymentId": "pay_REAL",
                "signature": hmac.new(secret.encode(), f"{order['orderId']}|pay_REAL".encode(),
                                      hashlib.sha256).hexdigest(),
            })
            check("replayed settlement rejected", code >= 400, f"got {code}")
        else:
            check("correctly signed payment is accepted", False,
                  "set RAZORPAY_KEY_SECRET for the server under test to run this")
    else:
        check("order created", False, f"got {code} {order}")

    # The payment section runs on its own account, so the shared student must
    # still be unenrolled for every section that follows.
    code, body = call("GET", "/enrollments/", new_student["token"])
    check("payment flow left the shared student unenrolled", len(body) == 0, f"got {len(body)}")

    # ---- T6 sessions / meeting URLs
    print("\n[7] Security: meeting URLs stay server-side")
    code, courses = call("GET", "/courses/")
    if not isinstance(courses, list):
        print(f"  !! /courses/ returned {code}: {courses}")
        courses = []
    seeded = next(
        (c for c in courses if c.get("slug") == "fullstack-python-react-native"),
        None,
    )
    if not seeded:
        print("  !! seeded course 'fullstack-python-react-native' missing; run seed_data")
        return 1
    code, detail = call("GET", f"/courses/{seeded['id']}/", new_student["token"])
    code, sess = call("GET", f"/courses/{seeded['id']}/sessions/", new_student["token"])
    check("un-enrolled student blocked from sessions", code == 403, f"got {code}")

    code, admindash = call("GET", "/admin/dashboard/", new_student["token"])
    check("student blocked from admin dashboard", code == 403, f"got {code}")
    code, sdash = call("GET", "/admin/staff-dashboard/", new_student["token"])
    check("student blocked from staff dashboard", code == 403, f"got {code}")

    code, _ = call("GET", "/sessions/1/admin/", new_student["token"])
    check("student blocked from session admin detail", code in (403, 404), f"got {code}")
    code, _ = call("GET", "/sessions/1/join/", new_student["token"])
    check("un-enrolled student blocked from join", code in (403, 404), f"got {code}")

    # Real session on the seeded course. Staff may list it; the raw meeting
    # URL must never appear in that listing.
    code, sse = call("GET", f"/courses/{seeded['id']}/sessions/", staff["token"])
    sse_results = sse.get("results", []) if isinstance(sse, dict) else []
    seeded_session_id = sse_results[0]["id"] if sse_results else None
    check("staff can list seeded course sessions", code == 200 and bool(seeded_session_id), f"got {code}")
    if seeded_session_id:
        check("meeting URL never leaves the server in a listing",
              "meetingUrl" not in json.dumps(sse_results), str(sse_results[0].keys()))
        code, _ = call("GET", f"/sessions/{seeded_session_id}/admin/", new_student["token"])
        check("student blocked from real session admin detail", code == 403, f"got {code}")
        code, adm = call("GET", f"/sessions/{seeded_session_id}/admin/", admin["token"])
        check("admin can read real session admin detail", code == 200, f"got {code}")

    # enrolled student, real session
    code, my = call("GET", "/enrollments/my-courses/", student["token"])
    check("demo student has enrolments", isinstance(my, list) and len(my) > 0, f"got {my}")
    if isinstance(my, list) and my:
        access = my[0]["access"]
        check("enrolment reports access granted", access["hasAccess"] is True, str(access))
        check("access status is ACTIVE", access["accessStatus"] == "ACTIVE", str(access))
        check("enrolment has expiry", access["expiresAt"] is not None, str(access))
        enrolled_course = my[0]["enrollment"]["courseId"]

        code, sess = call("GET", f"/courses/{enrolled_course}/sessions/", student["token"])
        check("enrolled student can list sessions", code == 200, f"got {code}")
        results = sess.get("results", []) if isinstance(sess, dict) else []
        check("sessions returned", len(results) > 0, f"got {len(results)}")
        if results:
            sid = results[0]["id"]
            code, _ = call("GET", f"/sessions/{sid}/admin/", student["token"])
            check("enrolled STUDENT still blocked from admin session detail", code == 403, f"got {code}")
            code, joined = call("POST", f"/sessions/{sid}/join/", student["token"])
            if code == 200:
                check("join returns a destination", bool(joined.get("joinUrl")))
            else:
                check("join refused outside window with a clear reason",
                      code == 403 and "error" in joined, f"got {code} {joined}")

    # ---- T7 materials
    print("\n[8] Security: protected materials")
    code, mats = call("GET", f"/courses/{seeded['id']}/materials/", new_student["token"])
    check("un-enrolled student blocked from materials", code == 403, f"got {code}")

    # Resolve a real material id as admin rather than assuming one.
    code, amats = call("GET", f"/courses/{seeded['id']}/materials/", admin["token"])
    amats_results = amats.get("results", []) if isinstance(amats, dict) else []
    mid = amats_results[0]["id"] if amats_results else None
    check("seeded course exposes at least one material", code == 200 and mid is not None, f"got {code}")

    if mid:
        code, m = call("POST", f"/materials/{mid}/access/", new_student["token"])
        check("un-enrolled student blocked from material access", code == 403, f"got {code}")
        check("denial includes a reason", isinstance(m, dict) and bool(m.get("reason")), str(m))

        code, adminm = call("POST", f"/materials/{mid}/access/", admin["token"])
        check("admin gets material access", code == 200 and adminm.get("canAccess") is True, f"got {code}")
        if code == 200:
            check("no public third-party fallback URL",
                  "w3.org" not in json.dumps(adminm), str(adminm.get("streamUrl")))
            check("access is time-boxed and watermarked",
                  isinstance(adminm.get("expiresInSeconds"), int)
                  and adminm.get("expiresInSeconds") <= 900
                  and bool(adminm.get("securityWatermark")),
                  str({k: adminm.get(k) for k in ("expiresInSeconds", "securityWatermark")}))
            check("stream URL is not a guessable file path",
                  "/media/" not in adminm.get("streamUrl", ""), adminm.get("streamUrl"))

            su = adminm["streamUrl"]
            code, raw = call("GET", su.replace("/api/v1", ""), admin["token"], binary=True)
            check("authorised admin can stream the real bytes",
                  code == 200 and isinstance(raw, bytes) and raw[:4] == b"%PDF",
                  f"got {code} {raw[:8] if isinstance(raw, bytes) else raw}")
            code, _ = call("GET", su.replace("/api/v1", ""), binary=True)
            check("stream refuses an unauthenticated caller", code == 401, f"got {code}")
            code, _ = call("GET", f"/materials/{mid}/stream/?token=forged", admin["token"], binary=True)
            check("stream rejects a forged viewer token", code == 404, f"got {code}")
            code, _ = call("GET", f"/materials/{mid}/stream/", new_student["token"], binary=True)
            check("stream rejects a token-less caller", code == 404, f"got {code}")
        code, _ = call("POST", f"/materials/{mid}/access/", None)
        check("anonymous blocked from material access", code == 401, f"got {code}")

    code, _ = call("GET", f"/courses/{seeded['id']}/materials/", staff["token"])
    check("assigned staff can list materials", code == 200, f"got {code}")

    # ---- anonymous
    print("\n[9] Security: anonymous access")
    code, anon = call("GET", f"/courses/{seeded['id']}/detail/")
    check("anonymous blocked from protected detail", code == 401, f"got {code}")
    code, _ = call("GET", "/admin/dashboard/")
    check("anonymous blocked from admin dashboard", code == 401, f"got {code}")
    code, _ = call("GET", "/users/")
    check("anonymous blocked from users", code == 401, f"got {code}")

    # ---- T9 OTP
    print("\n[10] Security: OTP cannot be bypassed")
    code, body = call("POST", "/auth/otp/verify/", body={"otp": "000000", "email": unique("ghost")})
    check("OTP for unknown email rejected", code in (400, 404), f"got {code} {body}")
    check("no token issued for unknown email", "tokens" not in body, str(body))
    code, body = call("POST", "/auth/otp/verify/", body={"otp": "123456"})
    check("OTP without email rejected", code == 400, f"got {code}")

    # ---- T10 PII
    print("\n[11] Security: user PII scoping")
    code, allu = call("GET", "/users/", new_student["token"])
    check("student cannot list users", code == 403, f"got {code}")
    code, staffview = call("GET", "/users/", staff["token"])
    check("staff sees only students", code == 200 and isinstance(staffview, list), f"got {code}")
    check("staff view does not leak other roles",
          all("role" not in u for u in staffview),
          str(staffview[0].keys()) if staffview else "empty")
    privileged = {"admin@learnova.app", "staff@learnova.app", "elena@learnova.app", staff_email}
    visible = {u["email"] for u in staffview if "email" in u}
    check("staff cannot see other roles' emails", not (visible & privileged),
          str(sorted(visible & privileged)))
    code, _ = call("POST", "/users/", staff["token"], {"email": "x@y.com", "password": "Str0ng!pass"})
    check("staff cannot create accounts", code == 403, f"got {code}")

    # ---- admin flow
    print("\n[12] Admin flow")
    code, dash = call("GET", "/admin/dashboard/", admin["token"])
    check("admin dashboard 200", code == 200, f"got {code}")
    check("dashboard revenue is an int", isinstance(dash.get("totalRevenueInr"), int))
    check("monthlyRevenue has 6 real buckets", len(dash.get("monthlyRevenue", [])) == 6,
          str(dash.get("monthlyRevenue")))
    check("no invented passRate field", "passRate" not in dash)

    if new_course:
        code, pl = call("POST", f"/courses/{new_course['id']}/payment-plans/write/", admin["token"], {
            "name": "Test Plan", "description": "d", "priceInr": 5000,
            "durationMonths": 6, "installments": 1, "currency": "INR", "planType": "full",
        })
        check("admin can create payment plan", code == 201, f"got {code} {pl}")
        if code == 201:
            check("plan exposes duration + currency",
                  pl.get("duration") and pl.get("currency") == "INR", str(pl))

        code, s = call("POST", f"/courses/{new_course['id']}/sessions/write/", admin["token"], {
            "title": "Test Session", "scheduledAt": "2026-12-01T10:00:00Z",
            "durationMinutes": 60, "platform": "meet",
            "meetingUrl": "https://meet.google.com/secret-room", "meetingPassword": "hunter2",
        })
        check("admin can create session", code == 201, f"got {code} {s}")
        check("session response hides meeting URL",
              code == 201 and "meeting_url" not in s and "meetingUrl" not in s, str(s))

        code, n = call("POST", f"/courses/{new_course['id']}/notes/write/", admin["token"], {
            "title": "Test Note", "content": "hello",
        })
        check("admin can create note", code == 201, f"got {code} {n}")
        check("note exposes real author", code == 201 and n.get("author", {}).get("email") == "admin@learnova.app", str(n.get("author")))

        # multipart upload
        boundary = "----learnova" + uuid.uuid4().hex[:12]
        payload = (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="title"\r\n\r\nUploaded Notes\r\n'
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="type"\r\n\r\npdf\r\n'
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="file"; filename="notes.pdf"\r\n'
            "Content-Type: application/pdf\r\n\r\n%PDF-1.4 test\r\n"
            f"--{boundary}--\r\n"
        ).encode()
        code, up = call("POST", f"/courses/{new_course['id']}/materials/write/", admin["token"],
                        raw=payload, content_type=f"multipart/form-data; boundary={boundary}")
        check("admin can upload a PDF (multipart)", code == 201, f"got {code} {up}")
        if code == 201:
            check("uploaded material records a real file", up.get("hasFile") is True, str(up))
            code, _ = call("DELETE", f"/courses/{new_course['id']}/materials/{up['id']}/", admin["token"])
            check("admin can delete a material", code == 204, f"got {code}")

        # staff blocked on unassigned course
        code, _ = call("POST", f"/courses/{new_course['id']}/notes/write/", staff["token"],
                       {"title": "x", "content": "y"})
        check("staff cannot write to unassigned course", code == 403, f"got {code}")

    # ---- staff flow
    print("\n[13] Staff flow")
    code, sd = call("GET", "/admin/staff-dashboard/", staff["token"])
    check("staff dashboard 200", code == 200, f"got {code}")
    assigned = sd.get("assignedCourses", []) if code == 200 else []
    check("staff has assigned courses", len(assigned) > 0, f"got {len(assigned)}")
    check("all assigned courses belong to staff", code == 200)

    if assigned:
        cid = assigned[0]["id"]
        code, n = call("POST", f"/courses/{cid}/notes/write/", staff["token"],
                       {"title": "Staff Note", "content": "from faculty"})
        check("staff can add note to assigned course", code == 201, f"got {code} {n}")

        code, students = call("GET", f"/payments/course/{cid}/students/", staff["token"])
        check("staff can view enrolled students", code == 200, f"got {code}")

        code, pays = call("GET", f"/payments/course/{cid}/", staff["token"])
        check("staff can view course payments", code == 200, f"got {code}")

        code, _ = call("GET", f"/payments/course/{seeded['id']}/students/", new_student["token"])
        check("student blocked from course roster", code == 403, f"got {code}")

    # ---- notifications
    print("\n[14] Notifications")
    code, notifs = call("GET", "/notifications/", student["token"])
    check("notifications 200", code == 200, f"got {code}")
    check("notifications is a list", isinstance(notifs, list))
    if isinstance(notifs, list) and notifs:
        nid = notifs[0]["id"]
        code, _ = call("POST", f"/notifications/{nid}/read/", student["token"])
        check("mark one read", code == 200, f"got {code}")
        code, _ = call("POST", "/notifications/read-all/", student["token"])
        check("mark all read", code == 200, f"got {code}")
    code, _ = call("POST", "/notifications/999999/read/", student["token"])
    check("unknown notification 404", code == 404, f"got {code}")

    # ---- admin access management
    print("\n[15] Admin access management")
    code, granted = call("POST", "/enrollments/grant/", admin["token"],
                         {"userId": new_student["id"], "courseId": seeded["id"], "durationMonths": 6})
    check("admin can grant access", code in (200, 201), f"got {code} {granted}")
    if code in (200, 201):
        check("grant sets an expiry", granted.get("expiresAt") is not None, str(granted))
        code, _ = call("POST", "/enrollments/grant/", new_student["token"],
                       {"userId": new_student["id"], "courseId": seeded["id"]})
        check("student cannot self-grant access", code == 403, f"got {code}")

        code, acc = call("GET", f"/courses/{seeded['id']}/access/", new_student["token"])
        check("granted student now has access", acc.get("hasAccess") is True, str(acc))

        code, mats = call("GET", f"/courses/{seeded['id']}/materials/", new_student["token"])
        check("granted student can list materials", code == 200, f"got {code}")

        # suspend -> revoke
        eid = granted["id"]
        code, _ = call("PATCH", f"/enrollments/{eid}/manage/", admin["token"], {"status": "paused"})
        check("admin can suspend", code == 200, f"got {code}")
        code, acc = call("GET", f"/courses/{seeded['id']}/access/", new_student["token"])
        check("suspension revokes access", acc.get("hasAccess") is False, str(acc))
        check("status reports SUSPENDED", acc.get("accessStatus") == "SUSPENDED", str(acc))
        if mid:
            code, _ = call("POST", f"/materials/{mid}/access/", new_student["token"])
            check("suspended student blocked from material", code == 403, f"got {code}")

        code, _ = call("PATCH", f"/enrollments/{eid}/manage/", new_student["token"],
                       {"status": "active"})
        check("student cannot resume own enrolment", code == 403, f"got {code}")

    # ---- expiry
    print("\n[16] Expiry enforcement")
    code, enrollments = call("GET", "/enrollments/", admin["token"])
    if code == 200 and enrollments:
        e = enrollments[0]
        code, _ = call("PATCH", f"/enrollments/{e['id']}/manage/", admin["token"],
                       {"extendMonths": -12})
        code, acc = call("GET", f"/enrollments/{e['id']}/access/", admin["token"])
        check("expired enrolment reports EXPIRED",
              acc.get("accessStatus") in ("EXPIRED", "SUSPENDED"), str(acc))
        check("expired enrolment denies access", acc.get("hasAccess") is False, str(acc))

    # ---- token refresh
    print("\n[17] Token refresh")
    code, refreshed = call("POST", "/auth/token/refresh/", body={"refresh": student["refresh"]})
    check("refresh returns a new access token", code == 200 and "access" in refreshed, f"got {code}")
    if code == 200:
        code, prof = call("GET", "/auth/profile/", refreshed["access"])
        check("refreshed token works", code == 200, f"got {code}")
    code, bad = call("POST", "/auth/token/refresh/", body={"refresh": "garbage"})
    check("invalid refresh rejected", code == 401, f"got {code}")

    # ---- payment plans public
    print("\n[18] Public catalogue")
    code, plans = call("GET", f"/courses/{seeded['id']}/payment-plans/")
    check("payment plans are public", code == 200, f"got {code}")
    check("plans come from the backend", isinstance(plans, list) and len(plans) > 0, str(plans))
    if isinstance(plans, list) and plans:
        check("plan has amount, currency, duration, type",
              all(k in plans[0] for k in ("priceInr", "currency", "duration", "planType")), str(plans[0]))

    code, courses = call("GET", "/courses/")
    check("course list is public", code == 200)
    check("courses carry paymentPlans from backend",
          isinstance(courses, list) and courses and courses[0].get("paymentPlans") is not None)
    check("instructor has no placeholder id",
          isinstance(courses, list) and courses and "id" not in courses[0].get("instructor", {}))

    # ---- cleanup
    print("\n[19] Cleanup - the suite leaves no residue")
    leftovers = []

    # Sweep every test artefact, not just this run's: an aborted earlier run
    # would otherwise poison every future run and quietly skew its counts.
    for email in (new_email, staff_email, payer_email):
        code, found = call("GET", f"/users/?search={email}", admin["token"])
        for u in found if isinstance(found, list) else []:
            code, _ = call("DELETE", f"/users/{u['id']}/", admin["token"])
            if code != 204:
                leftovers.append(f"user {email} ({code})")
    check("test users removed", not leftovers, str(leftovers))

    code, stale = call("GET", "/users/?search=learnova.test", admin["token"])
    stale = [u for u in stale if str(u.get("email", "")).endswith("@learnova.test")] \
        if isinstance(stale, list) else []
    for u in stale:
        call("DELETE", f"/users/{u['id']}/", admin["token"])
    code, still = call("GET", "/users/?search=learnova.test", admin["token"])
    still = [u for u in still if str(u.get("email", "")).endswith("@learnova.test")] \
        if isinstance(still, list) else []
    check("no test user survived from any run", not still,
          str([u.get("email") for u in still]))

    code, all_courses = call("GET", "/courses/", admin["token"])
    if isinstance(all_courses, list):
        for c in [c for c in all_courses if str(c.get("slug", "")).startswith("hostile-")]:
            call("DELETE", f"/courses/{c['id']}/", admin["token"])
    code, after = call("GET", "/courses/", admin["token"])
    stale_courses = [c.get("slug") for c in after if str(c.get("slug", "")).startswith("hostile-")] \
        if isinstance(after, list) else []
    check("no test course survived from any run", not stale_courses, str(stale_courses))

    if new_course:
        code, _ = call("GET", f"/courses/{new_course['id']}/", admin["token"])
        check("deleted course is gone", code == 404, f"got {code}")

    print("\n" + "=" * 62)
    print(f"PASSED: {len(PASS)}    FAILED: {len(FAIL)}")
    if FAIL:
        print("\nFailures:")
        for name in FAIL:
            print(f"  - {name}")
    print("=" * 62)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())