from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from core.access import add_months, DEFAULT_GRANT_MONTHS
from courses.models import Course, PaymentPlan, Session, Material, Note
from enrollments.models import Enrollment
from payments.models import Payment
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Seeds initial users, courses, payment plans, sessions, materials, and enrollments'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Learnova backend database...')
        now = timezone.now()

        # 1. Users
        admin, _ = User.objects.get_or_create(
            email='admin@learnova.app',
            defaults={
                'username': 'admin@learnova.app',
                'name': 'Sarah Jenkins (Admin)',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password('Admin@123')
        admin.save()

        staff, _ = User.objects.get_or_create(
            email='staff@learnova.app',
            defaults={
                'username': 'staff@learnova.app',
                'name': 'Dr. Marcus Vance (Faculty)',
                'role': 'staff',
                'is_staff': True,
            }
        )
        staff.set_password('Staff@123')
        staff.save()

        staff2, _ = User.objects.get_or_create(
            email='elena@learnova.app',
            defaults={
                'username': 'elena@learnova.app',
                'name': 'Elena Rostova (Faculty)',
                'role': 'staff',
                'is_staff': True,
            }
        )
        staff2.set_password('Staff@123')
        staff2.save()

        student, _ = User.objects.get_or_create(
            email='student@learnova.app',
            defaults={
                'username': 'student@learnova.app',
                'name': 'Alex Rivera (Student)',
                'role': 'student',
            }
        )
        student.set_password('Student@123')
        student.save()

        # 2. Courses
        c1, _ = Course.objects.get_or_create(
            slug='fullstack-python-react-native',
            defaults={
                'title': 'Full-Stack Python & React Native Architecture',
                'description': 'Master modern cross-platform mobile engineering with React Native, Expo, Django REST Framework, and production PostgreSQL deployment.',
                'category': 'Mobile Engineering',
                'level': 'intermediate',
                'instructor_name': 'Dr. Marcus Vance',
                'thumbnail_url': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
                'price_inr': 14999,
                'rating': 4.9,
                'total_reviews': 342,
                'total_enrolled': 1240,
                'duration_hours': 48,
                'total_sessions': 24,
                'tags': ['React Native', 'Django', 'TypeScript', 'PostgreSQL'],
                'is_published': True,
            }
        )

        c2, _ = Course.objects.get_or_create(
            slug='cloud-architecture-kubernetes',
            defaults={
                'title': 'Cloud Architecture & Microservices with Kubernetes',
                'description': 'Learn enterprise container orchestration, CI/CD pipelines, Docker, Kubernetes clusters, and zero-downtime deployment strategies.',
                'category': 'Cloud & DevOps',
                'level': 'advanced',
                'instructor_name': 'Elena Rostova',
                'thumbnail_url': 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800',
                'price_inr': 18999,
                'rating': 4.8,
                'total_reviews': 210,
                'total_enrolled': 890,
                'duration_hours': 36,
                'total_sessions': 18,
                'tags': ['Kubernetes', 'Docker', 'AWS', 'Microservices'],
                'is_published': True,
            }
        )

        # 3. Staff assignment - this is what makes "assigned courses" real.
        c1.assigned_staff.add(staff)
        c2.assigned_staff.add(staff2)

        # 4. Payment Plans for Course 1
        p1, _ = PaymentPlan.objects.get_or_create(
            course=c1,
            name='Full Upfront Payment',
            defaults={
                'description': 'Single payment for 12 months of course access',
                'price_inr': 14999,
                'currency': 'INR',
                'plan_type': 'full',
                'duration_months': 12,
                'installments': 1,
                'installment_amount_inr': 14999,
                'is_popular': True,
                'features': ['12 months access to all modules', 'Live mentor Q&A sessions', 'DRM protected materials', 'Verified Certificate'],
            }
        )

        p2, _ = PaymentPlan.objects.get_or_create(
            course=c1,
            name='3-Month Flexible EMI',
            defaults={
                'description': '3 convenient monthly installments',
                'price_inr': 15999,
                'currency': 'INR',
                'plan_type': 'installment',
                'duration_months': 3,
                'installments': 3,
                'installment_amount_inr': 5333,
                'is_popular': False,
                'features': ['Split across 3 months', 'Immediate module access', 'Live sessions included', 'No extra hidden interest'],
            }
        )

        PaymentPlan.objects.get_or_create(
            course=c2,
            name='Full Upfront Payment',
            defaults={
                'description': 'Single payment for 12 months of cloud architecture access',
                'price_inr': 18999,
                'currency': 'INR',
                'plan_type': 'full',
                'duration_months': 12,
                'installments': 1,
                'installment_amount_inr': 18999,
                'is_popular': True,
                'features': ['Kubernetes hands-on cluster access', 'Production CI/CD pipelines', 'CKA exam preparation'],
            }
        )

        # 5. Sessions
        Session.objects.get_or_create(
            course=c1,
            title='Session 1: Architecture Blueprint & Clean Architecture',
            defaults={
                'description': 'Deep dive into decoupled service layers and Expo router foundations.',
                'instructor_name': 'Dr. Marcus Vance',
                'start_time': now + timedelta(days=1),
                'duration_minutes': 90,
                'platform': 'meet',
                'meeting_url': 'https://meet.google.com/lnv-arch-demo',
                'meeting_id': 'lnv-arch-demo',
                'passcode': 'arch2026',
                'status': 'scheduled',
            }
        )

        Session.objects.get_or_create(
            course=c1,
            title='Session 2: State Management & TanStack Query Synchronization',
            defaults={
                'description': 'Live code walkthrough of optimistic mutations and server cache invalidation.',
                'instructor_name': 'Dr. Marcus Vance',
                'start_time': now + timedelta(days=3),
                'duration_minutes': 90,
                'platform': 'zoom',
                'meeting_url': 'https://zoom.us/j/9876543210',
                'meeting_id': '9876543210',
                'passcode': 'query2026',
                'status': 'scheduled',
            }
        )

        Session.objects.get_or_create(
            course=c2,
            title='Session 1: Kubernetes Cluster Architecture & Pod Lifecycle',
            defaults={
                'description': 'Container orchestration primitives, nodes, control planes, and ingress routing.',
                'instructor_name': 'Elena Rostova',
                'start_time': now + timedelta(days=2),
                'duration_minutes': 90,
                'platform': 'meet',
                'meeting_url': 'https://meet.google.com/lnv-k8s-demo',
                'meeting_id': 'lnv-k8s-demo',
                'passcode': 'k8s2026',
                'status': 'scheduled',
            }
        )

        # 6. Materials (DRM protected, served from MEDIA_ROOT - never a public URL)
        self._ensure_sample_material(
            c1, 'Enterprise Mobile Architecture Handbook',
            'Architecture handbook covering service layering, offline-first sync, '
            'and secure token storage.',
            staff,
        )
        self._ensure_sample_material(
            c1, 'Session 1 Presentation Slides',
            'Slide deck for the architecture blueprint session.',
            staff,
        )
        self._ensure_sample_material(
            c2, 'Kubernetes Microservices Security Blueprint',
            'Security blueprint for containerised microservices.',
            staff2,
        )

        # 7. Notes
        note, _ = Note.objects.get_or_create(
            course=c1,
            title='Key Architectural Takeaways & Security Checklist',
            defaults={
                'content': (
                    '# Learnova Mobile Architecture Notes\n\n'
                    '### Security Principles\n'
                    '- Never store raw meeting URLs or host credentials on the client.\n'
                    '- Use encrypted tokens for protected material access.\n'
                    '- Watermark viewable documents with the viewer email and timestamp.\n\n'
                    '### State Split\n'
                    '- **TanStack Query**: server cache, query keys, automatic retries.\n'
                    '- **Zustand**: client-only session hydration via SecureStore.\n'
                ),
                'author': staff,
            }
        )

        # 8. Enrollment with a real payment link and expiry
        payment, _ = Payment.objects.get_or_create(
            order_id='order_seed_student_c1',
            defaults={
                'user': student,
                'course': c1,
                'payment_plan': p1,
                'amount_inr': p1.price_inr,
                'currency': 'INR',
                'status': 'successful',
                'method': 'upi',
            },
        )

        enrollment, created = Enrollment.objects.get_or_create(
            user=student,
            course=c1,
            defaults={
                'payment_plan': p1,
                'payment': payment,
                'status': 'active',
                'progress_percentage': 35,
                'expires_at': add_months(now, 12),
            },
        )
        if not created and enrollment.expires_at is None:
            enrollment.expires_at = add_months(now, 12)
            enrollment.save(update_fields=['expires_at'])

        # 9. Notifications
        Notification.objects.get_or_create(
            user=student,
            title='Welcome to Learnova!',
            defaults={
                'message': 'Your account is ready. Explore the catalogue to get started.',
                'type': 'announcement',
                'is_read': False,
            }
        )

        Notification.objects.get_or_create(
            user=student,
            title='Upcoming Live Class Tomorrow',
            defaults={
                'message': 'Architecture Blueprint & Clean Architecture begins tomorrow.',
                'type': 'session_reminder',
                'is_read': False,
                'course_id': c1.id,
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded Learnova database!'))

    def _ensure_sample_material(self, course, title, description, author):
        """Materialise a small real PDF into MEDIA_ROOT so nothing points at a
        public third-party file URL."""
        from django.core.files.base import ContentFile
        from django.utils.text import slugify

        material, created = Material.objects.get_or_create(
            course=course,
            title=title,
            defaults={
                'type': 'pdf',
                'is_protected': True,
                'allow_download': False,
                'created_by': author,
            }
        )

        if created and not material.file:
            filename = f"{slugify(title)}.pdf"
            pdf = self._build_pdf(title, description)
            material.file.save(filename, ContentFile(pdf), save=True)
            material.file_size_bytes = len(pdf)
            material.save(update_fields=['file_size_bytes'])
        return material

    @staticmethod
    def _build_pdf(title, body):
        """Minimal single-page PDF containing real (if plain) text."""
        def esc(text):
            return text.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')

        lines = [f'BT /F1 16 Tf 60 760 Td ({esc(title)}) Tj ET',
                 f'BT /F1 11 Tf 60 730 Td ({esc(body[:90])}) Tj ET',
                 'BT /F1 9 Tf 60 700 Td (Learnova protected learning material.) Tj ET']
        content = '\n'.join(lines).encode('latin-1', 'replace')

        objects = [
            b'<< /Type /Catalog /Pages 2 0 R >>',
            b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
            b'/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            b'<< /Length ' + str(len(content)).encode() + b' >>\nstream\n' + content + b'\nendstream',
        ]

        out = bytearray(b'%PDF-1.4\n')
        offsets = []
        for index, body_bytes in enumerate(objects, start=1):
            offsets.append(len(out))
            out += f'{index} 0 obj\n'.encode() + body_bytes + b'\nendobj\n'

        xref_at = len(out)
        out += f'xref\n0 {len(objects) + 1}\n'.encode()
        out += b'0000000000 65535 f \n'
        for offset in offsets:
            out += f'{offset:010d} 00000 n \n'.encode()
        out += (
            f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n'
            f'startxref\n{xref_at}\n%%EOF\n'
        ).encode()
        return bytes(out)
