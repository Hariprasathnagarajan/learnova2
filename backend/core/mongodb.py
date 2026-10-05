"""
MongoDB Database Connector & Service for Learnova
Provides connection management, collection access, health checks, and sync utilities.
Compatible with local MongoDB (mongodb://localhost:27017) and MongoDB Atlas (mongodb+srv://...).
"""
import os
import logging
from typing import Optional, Dict, Any
from django.conf import settings
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, PyMongoError

logger = logging.getLogger(__name__)

_mongo_client: Optional[MongoClient] = None

def get_mongo_uri() -> str:
    """Retrieve the configured MongoDB connection URI."""
    return getattr(
        settings, 
        'MONGO_URI', 
        os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    )

def get_mongo_db_name() -> str:
    """Retrieve the configured MongoDB database name."""
    return getattr(
        settings, 
        'MONGO_DB_NAME', 
        os.environ.get('MONGO_DB_NAME', 'learnova_db')
    )

def get_mongo_client() -> MongoClient:
    """
    Get or initialize the thread-safe MongoClient singleton.
    """
    global _mongo_client
    if _mongo_client is None:
        uri = get_mongo_uri()
        client_kwargs = {
            'serverSelectionTimeoutMS': 5000,
            'connectTimeoutMS': 5000,
            'socketTimeoutMS': 10000,
            'maxPoolSize': 50,
            'minPoolSize': 5,
        }
        if 'mongodb+srv' in uri or 'ssl=true' in uri.lower():
            try:
                import certifi
                client_kwargs['tlsCAFile'] = certifi.where()
            except ImportError:
                pass
        try:
            _mongo_client = MongoClient(uri, **client_kwargs)
            # Verify connectivity immediately
            _mongo_client.admin.command('ping')
            logger.info("MongoDB client connected successfully to %s", uri.split('@')[-1])
        except (ConnectionFailure, PyMongoError) as e:
            logger.warning("MongoDB ping failed on initialization: %s", e)
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
    Check MongoDB connectivity and return connection status & stats.
    """
    try:
        client = get_mongo_client()
        result = client.admin.command('ping')
        server_info = client.server_info()
        db = get_mongo_db()
        collections = db.list_collection_names()
        
        counts = {}
        for coll in collections:
            counts[coll] = db[coll].count_documents({})

        return {
            'connected': True,
            'database': db.name,
            'mongodb_version': server_info.get('version', 'unknown'),
            'ping_ok': result.get('ok') == 1.0,
            'collections': collections,
            'document_counts': counts,
        }
    except Exception as e:
        logger.error("MongoDB health check failed: %s", e)
        return {
            'connected': False,
            'error': str(e),
            'database': get_mongo_db_name(),
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
    users_coll = db['users']
    synced_users = 0
    for user in User.objects.all():
        doc = {
            'django_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        }
        users_coll.update_one({'django_id': user.id}, {'$set': doc}, upsert=True)
        synced_users += 1
    results['users'] = synced_users

    # 2. Courses
    courses_coll = db['courses']
    synced_courses = 0
    for course in Course.objects.all():
        plans = [
            {
                'id': p.id,
                'name': p.name,
                'price_inr': p.price_inr,
                'plan_type': p.plan_type,
                'duration_months': p.duration_months,
                'installments': p.installments,
            }
            for p in course.payment_plans.all()
        ]
        doc = {
            'django_id': course.id,
            'title': course.title,
            'slug': course.slug,
            'description': course.description,
            'short_description': getattr(course, 'short_description', course.description[:150] if course.description else ''),
            'category': course.category,
            'level': course.level,
            'instructor_name': course.instructor_name,
            'price_inr': course.price_inr,
            'rating': course.rating,
            'total_reviews': course.total_reviews,
            'total_enrolled': course.total_enrolled,
            'duration_hours': course.duration_hours,
            'total_sessions': course.total_sessions,
            'tags': course.tags,
            'is_published': course.is_published,
            'payment_plans': plans,
            'created_at': course.created_at.isoformat() if course.created_at else None,
        }
        courses_coll.update_one({'django_id': course.id}, {'$set': doc}, upsert=True)
        synced_courses += 1
    results['courses'] = synced_courses

    # 3. Sessions
    sessions_coll = db['sessions']
    synced_sessions = 0
    for session in Session.objects.all():
        doc = {
            'django_id': session.id,
            'course_id': session.course_id,
            'title': session.title,
            'instructor_name': session.instructor_name,
            'start_time': session.start_time.isoformat() if session.start_time else None,
            'duration_minutes': session.duration_minutes,
            'platform': session.platform,
            'status': session.status,
            'is_live': session.status == 'live',
        }
        sessions_coll.update_one({'django_id': session.id}, {'$set': doc}, upsert=True)
        synced_sessions += 1
    results['sessions'] = synced_sessions

    # 4. Materials
    materials_coll = db['materials']
    synced_materials = 0
    for mat in Material.objects.all():
        doc = {
            'django_id': mat.id,
            'course_id': mat.course_id,
            'title': mat.title,
            'type': mat.type,
            'file_url': mat.file_url,
            'is_protected': mat.is_protected,
            'allow_download': mat.allow_download,
        }
        materials_coll.update_one({'django_id': mat.id}, {'$set': doc}, upsert=True)
        synced_materials += 1
    results['materials'] = synced_materials

    # 5. Enrollments
    enrollments_coll = db['enrollments']
    synced_enrollments = 0
    for enr in Enrollment.objects.all():
        doc = {
            'django_id': enr.id,
            'user_id': enr.user_id,
            'course_id': enr.course_id,
            'status': enr.status,
            'progress_percent': getattr(enr, 'progress_percentage', 0),
            'enrolled_at': enr.enrolled_at.isoformat() if enr.enrolled_at else None,
        }
        enrollments_coll.update_one({'django_id': enr.id}, {'$set': doc}, upsert=True)
        synced_enrollments += 1
    results['enrollments'] = synced_enrollments

    # 6. Payments
    payments_coll = db['payments']
    synced_payments = 0
    for pay in Payment.objects.all():
        doc = {
            'django_id': pay.id,
            'user_id': pay.user_id,
            'course_id': pay.course_id,
            'order_id': pay.order_id,
            'payment_id': pay.payment_id,
            'amount_inr': pay.amount_inr,
            'status': pay.status,
            'method': getattr(pay, 'method', 'upi'),
            'created_at': pay.created_at.isoformat() if pay.created_at else None,
        }
        payments_coll.update_one({'django_id': pay.id}, {'$set': doc}, upsert=True)
        synced_payments += 1
    results['payments'] = synced_payments

    return results
