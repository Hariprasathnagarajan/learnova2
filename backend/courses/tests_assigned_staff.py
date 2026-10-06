from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from courses.models import Course

User = get_user_model()

class AssignedStaffTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin_test@learnova.com',
            password='Password123!',
            role='admin',
            is_staff=True,
            is_superuser=True,
        )
        self.staff1 = User.objects.create_user(
            email='staff1_test@learnova.com',
            password='Password123!',
            role='staff',
            first_name='Staff',
            last_name='One',
        )
        self.staff2 = User.objects.create_user(
            email='staff2_test@learnova.com',
            password='Password123!',
            role='staff',
            first_name='Staff',
            last_name='Two',
        )
        self.student = User.objects.create_user(
            email='student_test@learnova.com',
            password='Password123!',
            role='student',
            first_name='Student',
            last_name='User',
        )

    def test_admin_create_course_with_assigned_staff(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/v1/courses/', {
            'title': 'Test Course Alpha',
            'description': 'Description alpha',
            'category': 'Development',
            'level': 'beginner',
            'assigned_to': [self.staff1.id, self.staff2.id],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertIn('assigned_to', data)
        self.assertIn(self.staff1.id, data['assigned_to'])
        self.assertIn(self.staff2.id, data['assigned_to'])
        self.assertEqual(len(data['assigned_staff']), 2)

    def test_admin_assign_non_staff_fails(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/v1/courses/', {
            'title': 'Test Invalid Assignment',
            'description': 'Description',
            'category': 'Development',
            'level': 'beginner',
            'assigned_to': [self.student.id],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assigned_to', res.json())

    def test_staff_cannot_change_assigned_to(self):
        course = Course.objects.create(
            title='Staff Assigned Course',
            slug='staff-assigned-course',
            description='Desc',
            category='Dev',
        )
        course.assigned_staff.add(self.staff1)

        self.client.force_authenticate(user=self.staff1)
        res = self.client.patch(f'/api/v1/courses/{course.id}/', {
            'assigned_to': [self.staff2.id],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assigned_to', res.json())

    def test_staff_only_sees_assigned_courses(self):
        course1 = Course.objects.create(
            title='Course Staff 1',
            slug='course-staff-1',
            description='Desc',
            category='Dev',
            is_published=True,
        )
        course1.assigned_staff.add(self.staff1)

        course2 = Course.objects.create(
            title='Course Staff 2',
            slug='course-staff-2',
            description='Desc',
            category='Dev',
            is_published=True,
        )
        course2.assigned_staff.add(self.staff2)

        self.client.force_authenticate(user=self.staff1)
        res = self.client.get('/api/v1/courses/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [c['id'] for c in res.json()]
        self.assertIn(str(course1.id), ids)
        self.assertNotIn(str(course2.id), ids)

    def test_admin_update_course_assigned_to(self):
        course = Course.objects.create(
            title='Course To Update',
            slug='course-to-update',
            description='Desc',
            category='Dev',
        )
        course.assigned_staff.add(self.staff1)

        self.client.force_authenticate(user=self.admin)
        res = self.client.patch(f'/api/v1/courses/{course.id}/', {
            'assigned_to': [self.staff2.id],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['assigned_to'], [self.staff2.id])
        course.refresh_from_db()
        self.assertEqual(list(course.assigned_staff.values_list('id', flat=True)), [self.staff2.id])

    def test_admin_search_staff_by_name_and_email(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/v1/users/?role=staff&search=Staff One')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.json()
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]['id']), str(self.staff1.id))

        res2 = self.client.get('/api/v1/users/?role=staff&search=staff2_test')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        results2 = res2.json()
        self.assertEqual(len(results2), 1)
        self.assertEqual(str(results2[0]['id']), str(self.staff2.id))
