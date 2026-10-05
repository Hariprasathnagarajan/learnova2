# 🎓 Learnova — Demo Credentials & Testing Guide

Welcome to the **Learnova Online Learning Platform** mobile application prototype.
All three user roles are completely functional with mock data and real state simulation.

---

## 🔑 Quick Demo Credentials

You can use the one-tap **"QUICK DEMO LOGIN"** buttons on the Login screen, or enter the credentials below manually:

### 1. Student Account
- **Email**: `student@learnova.app`
- **Password**: `Student@123`
- **Role**: `student`
- **Name**: Rohan Verma
- **What to test**:
  - Home feed with active enrollments & progress bars
  - Course catalog exploration with level/category filters
  - Course details with flexible payment plans (One-time vs Flexi EMI)
  - Interactive Checkout with order summary and simulated Razorpay order creation
  - Course Dashboard with live class schedules
  - **Live Class Attendance**: Tap **"Join Live Class"** (safely redirects without exposing raw backend meeting credentials)
  - **Protected Material Viewer**: Tap into study slides/notes. Features DRM overlay watermark (`student@learnova.app`) and `expo-screen-capture` screenshot deterrence.
  - Markdown Course Notes preview
  - Tax receipts & Payment history

---

### 2. Faculty / Staff Account
- **Email**: `staff@learnova.app`
- **Password**: `Staff@123`
- **Role**: `staff`
- **Name**: Priya Nair
- **What to test**:
  - Instructor Workspace with assigned courses and live student count
  - Host live sessions trigger on Zoom / Google Meet
  - Content Composer: Publish DRM-protected PDFs or Markdown notes directly to batch
  - Faculty notifications and alerts

---

### 3. Administrator Account
- **Email**: `admin@learnova.app`
- **Password**: `Admin@123`
- **Role**: `admin`
- **Name**: Arjun Sharma
- **What to test**:
  - High-level platform health metrics (total revenue in ₹ INR, active student count, monthly growth)
  - User Directory: Filter students vs faculty, inspect user details, and toggle active/suspended status
  - Add Staff Faculty member wizard
  - Course Catalog Management (published, draft, archived)
  - **7-Step Course Creation Wizard**:
    1. Basics (Title, Category, Level)
    2. Description & Outcomes
    3. Media & Cover image
    4. Faculty Instructor assignment
    5. Schedule & Session count
    6. Pricing (One-time INR & Flexi monthly EMI)
    7. Review & Instant Publish
  - Platform Payment Ledger with transaction tracking and order IDs

---

## 🛠️ Connecting to the Backend

Learnova talks to a real Django REST Framework API. There is no mock/offline mode:
if the API is unreachable the app surfaces the error rather than inventing data.
All requests go through the service layer (`src/services/api/client.ts` and
`src/services/*`).

Configure the endpoint in `.env` (or per EAS build profile):
```env
# Android emulator -> 10.0.2.2, iOS simulator -> localhost, physical device -> your LAN IP
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1

# Optional: only a fallback for when the server does not return a key id.
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY

# Optional: verbose request logging, forced off in release builds.
EXPO_PUBLIC_ENABLE_API_LOGGING=false
```

`EXPO_PUBLIC_API_URL` has no built-in default. If it is missing or malformed the
app fails fast on startup with an explanatory message instead of silently pointing
at the wrong host.

Payments require Razorpay keys on the **server**
(`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`). Without them the backend refuses to
create orders rather than faking a successful payment. Checkout uses
`react-native-razorpay`, a native module, so it needs a development build
(`npx expo run:android` or an EAS development build) - it will not run in Expo Go.
