"""
MongoDB Database Connector & Service for Learnova
Provides production-grade connection management, URL-encoded credential handling,
strict TLS/SSL certificate verification, health checks, detailed error diagnostics,
and synchronization utilities.

Compatible with local MongoDB (mongodb://localhost:27017) and MongoDB Atlas (mongodb+srv://...).
"""
import os
import re
import time
import logging
import threading
import urllib.parse
from typing import Optional, Dict, Any, Tuple
from django.conf import settings
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, PyMongoError, ServerSelectionTimeoutError, OperationFailure

logger = logging.getLogger(__name__)

_mongo_client: Optional[MongoClient] = None
_client_lock = threading.Lock()


def mask_mongo_uri(uri: str) -> str:
    """
    Mask username and password in a MongoDB URI for safe logging.
    Example: mongodb+srv://user:pass@cluster.mongodb.net -> mongodb+srv://us***:***@cluster.mongodb.net
    """
    if not uri:
        return ""
    try:
        scheme, sep, rest = uri.partition("://")
        if not sep:
            return "mongodb://***"
        if "@" in rest:
            userinfo, at, host_part = rest.rpartition("@")
            if ":" in userinfo:
                user, _, _ = userinfo.partition(":")
                masked_user = f"{user[:2]}***" if len(user) > 2 else "***"
                return f"{scheme}://{masked_user}:***@{host_part}"
            else:
                masked_user = f"{userinfo[:2]}***" if len(userinfo) > 2 else "***"
                return f"{scheme}://{masked_user}:***@{host_part}"
        return f"{scheme}://{rest}"
    except Exception:
        return "mongodb://[masked]"


def sanitize_and_encode_mongo_uri(raw_uri: str, default_db: str = "learnova_db") -> str:
    """
    Validate, URL-encode credentials, and normalize a MongoDB connection URI.
    Ensures that usernames and passwords containing special characters (e.g. @, :, #, %, &, +)
    are properly escaped with urllib.parse.quote_plus without double-encoding.
    """
    if not raw_uri:
        return ""
    raw_uri = raw_uri.strip()
    try:
        scheme, sep, rest = raw_uri.partition("://")
        if not sep:
            return raw_uri

        # Separate query parameters if present
        base_rest, q_sep, query = rest.partition("?")

        # Check for user authentication credentials
        if "@" in base_rest:
            userinfo, at, host_path = base_rest.rpartition("@")
            if ":" in userinfo:
                username, password = userinfo.split(":", 1)
                user_clean = urllib.parse.quote_plus(urllib.parse.unquote_plus(username))
                pass_clean = urllib.parse.quote_plus(urllib.parse.unquote_plus(password))
                auth_part = f"{user_clean}:{pass_clean}@"
            else:
                user_clean = urllib.parse.quote_plus(urllib.parse.unquote_plus(userinfo))
                auth_part = f"{user_clean}@"
        else:
            auth_part = ""
            host_path = base_rest

        # Handle host and database path
        if "/" in host_path:
            host, slash, path = host_path.partition("/")
            db_name = path if path else default_db
        else:
            host = host_path
            db_name = default_db

        final_uri = f"{scheme}://{auth_part}{host}/{db_name}"

        # Ensure retryWrites and w=majority for Atlas SRV connections
        if query:
            final_uri = f"{final_uri}?{query}"
        elif scheme == "mongodb+srv":
            final_uri = f"{final_uri}?retryWrites=true&w=majority"

        return final_uri
    except Exception as e:
        logger.warning("URI sanitization encountered an exception: %s. Using raw URI.", e)
        return raw_uri


def get_mongo_db_name() -> str:
    """Retrieve the configured MongoDB database name."""
    return getattr(
        settings, 
        "MONGO_DB_NAME", 
        os.environ.get("MONGO_DB_NAME") or os.environ.get("MONGODB_DATABASE") or "learnova_db"
    )


def get_mongo_uri() -> str:
    """
    Retrieve the configured MongoDB connection URI.
    Supports MONGO_URI, MONGODB_URI, Django settings, or builds from discrete components.
    """
    db_name = get_mongo_db_name()

    # 1. Check Django settings
    uri = getattr(settings, "MONGO_URI", None) or getattr(settings, "MONGODB_URI", None)
    
    # 2. Check environment variables
    if not uri:
        uri = os.environ.get("MONGO_URI") or os.environ.get("MONGODB_URI")

    # 3. Build from discrete variables if provided
    if not uri:
        username = os.environ.get("MONGODB_USERNAME") or os.environ.get("MONGO_USER")
        password = os.environ.get("MONGODB_PASSWORD") or os.environ.get("MONGO_PASSWORD")
        host = os.environ.get("MONGODB_HOST") or os.environ.get("MONGO_HOST")
        if username and password and host:
            user_enc = urllib.parse.quote_plus(username)
            pass_enc = urllib.parse.quote_plus(password)
            scheme = "mongodb+srv" if "mongodb.net" in host else "mongodb"
            uri = f"{scheme}://{user_enc}:{pass_enc}@{host}/{db_name}?retryWrites=true&w=majority"

    # 4. Fallback to local MongoDB
    if not uri:
        uri = f"mongodb://localhost:27017/{db_name}"

    return sanitize_and_encode_mongo_uri(uri, default_db=db_name)


def diagnose_mongo_error(exc: Exception, raw_uri: str) -> Dict[str, str]:
    """
    Analyze a MongoDB connection exception and return clear, actionable diagnostic guidance.
    """
    msg = str(exc)
    masked_target = mask_mongo_uri(raw_uri)
    
    # 1. Atlas Network Access / IP Whitelist Failure
    if "TLSV1_ALERT_INTERNAL_ERROR" in msg or "tlsv1 alert internal error" in msg.lower():
        return {
            "category": "ATLAS_NETWORK_ACCESS_BLOCKED",
            "summary": "MongoDB Atlas rejected the TLS handshake with TLSV1_ALERT_INTERNAL_ERROR.",
            "root_cause": (
                "The client IP address (from your local machine or Render cloud container) "
                "is not whitelisted in the MongoDB Atlas Network Access IP Access List. "
                "Atlas terminates TLS immediately when an unwhitelisted IP attempts to connect."
            ),
            "resolution": (
                "1. Log in to cloud.mongodb.com.\n"
                "2. Navigate to Security > Network Access.\n"
                "3. Click '+ Add IP Address'.\n"
                "4. Select 'Allow Access from Anywhere' (0.0.0.0/0) or add your specific client IP.\n"
                "5. Click 'Confirm' and wait 30 seconds for the rule to apply."
            ),
        }

    # 2. Replica Set Primary Selection Timeout
    if "ServerSelectionTimeoutError" in type(exc).__name__ or "ReplicaSetNoPrimary" in msg:
        return {
            "category": "REPLICA_SET_TIMEOUT",
            "summary": "Timed out selecting a primary server in the replica set.",
            "root_cause": (
                f"Client could not reach an active primary node on {masked_target} within "
                "the configured serverSelectionTimeoutMS. This happens if the cluster is paused, "
                "DNS SRV lookup failed, or outbound network traffic to port 27017 is blocked."
            ),
            "resolution": (
                "1. Verify the MongoDB Atlas cluster is in the 'Active' state (not paused).\n"
                "2. Confirm port 27017 outbound traffic is permitted by firewalls/security groups.\n"
                "3. Increase MONGO_SERVER_SELECTION_TIMEOUT_MS (default is 30000ms).\n"
                "4. Check that 0.0.0.0/0 is configured under Atlas Network Access."
            ),
        }

    # 3. Authentication Failure
    if isinstance(exc, OperationFailure) or "Authentication failed" in msg or "auth failed" in msg.lower():
        return {
            "category": "AUTHENTICATION_FAILED",
            "summary": "MongoDB Atlas rejected the database username or password.",
            "root_cause": (
                "The provided database credentials do not match any user in the Atlas cluster, "
                "or the user lacks readWrite permissions on the target database."
            ),
            "resolution": (
                "1. In MongoDB Atlas, go to Security > Database Access.\n"
                "2. Verify the username exists and has 'Read and write to any database' built-in role.\n"
                "3. If the password was recently reset, ensure the URI is updated.\n"
                "4. If the password contains special characters, verify URL-encoding."
            ),
        }

    # 4. Generic / Other PyMongo Error
    return {
        "category": "CONNECTION_ERROR",
        "summary": f"MongoDB error: {type(exc).__name__}",
        "root_cause": msg,
        "resolution": "Check the connection URI, network routing, and cluster status.",
    }


def get_mongo_client(force_reconnect: bool = False) -> MongoClient:
    """
    Get or initialize the thread-safe MongoClient singleton with production timeouts
    and strict TLS/SSL verification.
    """
    global _mongo_client
    with _client_lock:
        if _mongo_client is not None and not force_reconnect:
            return _mongo_client

        if force_reconnect and _mongo_client is not None:
            try:
                _mongo_client.close()
            except Exception:
                pass
            _mongo_client = None

        uri = get_mongo_uri()
        masked_uri = mask_mongo_uri(uri)

        # Production-grade timeout parameters
        server_selection_timeout_ms = int(os.environ.get("MONGO_SERVER_SELECTION_TIMEOUT_MS", "30000"))
        connect_timeout_ms = int(os.environ.get("MONGO_CONNECT_TIMEOUT_MS", "20000"))
        socket_timeout_ms = int(os.environ.get("MONGO_SOCKET_TIMEOUT_MS", "30000"))
        max_pool_size = int(os.environ.get("MONGO_MAX_POOL_SIZE", "50"))
        min_pool_size = int(os.environ.get("MONGO_MIN_POOL_SIZE", "5"))
        max_idle_time_ms = int(os.environ.get("MONGO_MAX_IDLE_TIME_MS", "60000"))

        client_kwargs: Dict[str, Any] = {
            "serverSelectionTimeoutMS": server_selection_timeout_ms,
            "connectTimeoutMS": connect_timeout_ms,
            "socketTimeoutMS": socket_timeout_ms,
            "maxPoolSize": max_pool_size,
            "minPoolSize": min_pool_size,
            "maxIdleTimeMS": max_idle_time_ms,
            "retryWrites": True,
            "retryReads": True,
        }

        # Strict TLS/SSL configuration with certifi CA root bundle
        is_tls = "mongodb+srv" in uri or "ssl=true" in uri.lower() or "tls=true" in uri.lower()
        if is_tls:
            client_kwargs["tls"] = True
            try:
                import certifi
                client_kwargs["tlsCAFile"] = certifi.where()
            except ImportError:
                logger.warning("certifi is not installed. Relying on system CA certificates for MongoDB TLS.")

        logger.info(
            "Initializing MongoClient -> Target: %s [timeouts: select=%dms, connect=%dms, socket=%dms, tls=%s]",
            masked_uri,
            server_selection_timeout_ms,
            connect_timeout_ms,
            socket_timeout_ms,
            is_tls,
        )

        try:
            client = MongoClient(uri, **client_kwargs)
            # Verify connectivity immediately with admin ping
            start_time = time.time()
            client.admin.command("ping")
            latency_ms = round((time.time() - start_time) * 1000, 2)
            server_info = client.server_info()
            version = server_info.get("version", "unknown")

            logger.info(
                "MongoDB connection established successfully! Version: v%s, Ping Latency: %.2f ms, Target: %s",
                version,
                latency_ms,
                masked_uri,
            )
            _mongo_client = client
        except (ConnectionFailure, PyMongoError) as e:
            diag = diagnose_mongo_error(e, uri)
            logger.error(
                "MongoDB connection initialization failed [%s]: %s\nRoot Cause: %s\nResolution:\n%s",
                diag["category"],
                e,
                diag["root_cause"],
                diag["resolution"],
            )
            # Still store client instance so caller gets the exact PyMongo exception on subsequent query
            _mongo_client = client if 'client' in locals() else None
            raise

    return _mongo_client


def get_mongo_db() -> Database:
    """Get the active MongoDB database."""
    client = get_mongo_client()
    return client[get_mongo_db_name()]


def get_collection(name: str) -> Collection:
    """Get a specific collection from the MongoDB database."""
    db = get_mongo_db()
    return db[name]


def check_mongo_connection() -> Dict[str, Any]:
    """
    Check MongoDB connectivity and return rich diagnostic stats.
    Includes target host, ping latency, version, collections, and document counts.
    """
    raw_uri = get_mongo_uri()
    masked_target = mask_mongo_uri(raw_uri)
    db_name = get_mongo_db_name()

    try:
        client = get_mongo_client()
        start_time = time.time()
        ping_res = client.admin.command("ping")
        latency_ms = round((time.time() - start_time) * 1000, 2)
        server_info = client.server_info()
        db = client[db_name]
        collections = db.list_collection_names()

        counts = {}
        for coll in collections:
            counts[coll] = db[coll].count_documents({})

        return {
            "connected": True,
            "database": db_name,
            "target": masked_target,
            "mongodb_version": server_info.get("version", "unknown"),
            "ping_ok": ping_res.get("ok") == 1.0,
            "ping_latency_ms": latency_ms,
            "collections": collections,
            "document_counts": counts,
            "tls_enabled": "mongodb+srv" in raw_uri or "tls=true" in raw_uri.lower(),
            "timeouts": {
                "serverSelectionTimeoutMS": int((client.options.server_selection_timeout or 0) * 1000) if client.options.server_selection_timeout else None,
                "connectTimeoutMS": int((client.options.pool_options.connect_timeout or 0) * 1000) if getattr(client.options, 'pool_options', None) and client.options.pool_options.connect_timeout else None,
                "socketTimeoutMS": int((client.options.pool_options.socket_timeout or 0) * 1000) if getattr(client.options, 'pool_options', None) and client.options.pool_options.socket_timeout else None,
            },
        }
    except Exception as e:
        logger.error("MongoDB health check check_mongo_connection() failed: %s", e)
        diag = diagnose_mongo_error(e, raw_uri)
        return {
            "connected": False,
            "database": db_name,
            "target": masked_target,
            "error": str(e),
            "error_type": type(e).__name__,
            "category": diag["category"],
            "summary": diag["summary"],
            "root_cause": diag["root_cause"],
            "resolution": diag["resolution"],
        }


def sync_django_to_mongodb() -> Dict[str, Any]:
    """
    Sync existing relational models into MongoDB collections as documents.
    """
    from accounts.models import User
    from courses.models import Course, Session, Material, Note, PaymentPlan
    from enrollments.models import Enrollment
    from payments.models import Payment
    from notifications.models import Notification

    db = get_mongo_db()
    results = {}

    # 1. Users
    users_coll = db["users"]
    synced_users = 0
    for user in User.objects.all():
        doc = {
            "django_id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "date_joined": user.date_joined.isoformat() if user.date_joined else None,
        }
        users_coll.update_one({"django_id": user.id}, {"$set": doc}, upsert=True)
        synced_users += 1
    results["users"] = synced_users

    # 2. Courses
    courses_coll = db["courses"]
    synced_courses = 0
    for course in Course.objects.all():
        plans = [
            {
                "id": p.id,
                "name": p.name,
                "price_inr": p.price_inr,
                "plan_type": p.plan_type,
                "duration_months": p.duration_months,
                "installments": p.installments,
            }
            for p in course.payment_plans.all()
        ]
        doc = {
            "django_id": course.id,
            "title": course.title,
            "slug": course.slug,
            "description": course.description,
            "short_description": getattr(course, "short_description", course.description[:150] if course.description else ""),
            "category": course.category,
            "level": course.level,
            "instructor_name": course.instructor_name,
            "price_inr": course.price_inr,
            "rating": course.rating,
            "total_reviews": course.total_reviews,
            "total_enrolled": course.total_enrolled,
            "duration_hours": course.duration_hours,
            "total_sessions": course.total_sessions,
            "tags": course.tags,
            "is_published": course.is_published,
            "payment_plans": plans,
            "created_at": course.created_at.isoformat() if course.created_at else None,
        }
        courses_coll.update_one({"django_id": course.id}, {"$set": doc}, upsert=True)
        synced_courses += 1
    results["courses"] = synced_courses

    # 3. Sessions
    sessions_coll = db["sessions"]
    synced_sessions = 0
    for session in Session.objects.all():
        doc = {
            "django_id": session.id,
            "course_id": session.course_id,
            "title": session.title,
            "instructor_name": session.instructor_name,
            "start_time": session.start_time.isoformat() if session.start_time else None,
            "duration_minutes": session.duration_minutes,
            "platform": session.platform,
            "status": session.status,
            "is_live": session.status == "live",
        }
        sessions_coll.update_one({"django_id": session.id}, {"$set": doc}, upsert=True)
        synced_sessions += 1
    results["sessions"] = synced_sessions

    # 4. Materials
    materials_coll = db["materials"]
    synced_materials = 0
    for mat in Material.objects.all():
        doc = {
            "django_id": mat.id,
            "course_id": mat.course_id,
            "title": mat.title,
            "type": mat.type,
            "file_url": mat.file_url,
            "is_protected": mat.is_protected,
            "allow_download": mat.allow_download,
        }
        materials_coll.update_one({"django_id": mat.id}, {"$set": doc}, upsert=True)
        synced_materials += 1
    results["materials"] = synced_materials

    # 5. Enrollments
    enrollments_coll = db["enrollments"]
    synced_enrollments = 0
    for enr in Enrollment.objects.all():
        doc = {
            "django_id": enr.id,
            "user_id": enr.user_id,
            "course_id": enr.course_id,
            "status": enr.status,
            "progress_percent": getattr(enr, "progress_percentage", 0),
            "enrolled_at": enr.enrolled_at.isoformat() if enr.enrolled_at else None,
        }
        enrollments_coll.update_one({"django_id": enr.id}, {"$set": doc}, upsert=True)
        synced_enrollments += 1
    results["enrollments"] = synced_enrollments

    # 6. Payments
    payments_coll = db["payments"]
    synced_payments = 0
    for pay in Payment.objects.all():
        doc = {
            "django_id": pay.id,
            "user_id": pay.user_id,
            "course_id": pay.course_id,
            "order_id": pay.order_id,
            "payment_id": pay.payment_id,
            "amount_inr": pay.amount_inr,
            "status": pay.status,
            "method": getattr(pay, "method", "upi"),
            "created_at": pay.created_at.isoformat() if pay.created_at else None,
        }
        payments_coll.update_one({"django_id": pay.id}, {"$set": doc}, upsert=True)
        synced_payments += 1
    results["payments"] = synced_payments

    return results
