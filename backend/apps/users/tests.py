from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class UserModelTests(TestCase):
    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('password123'))
        self.assertEqual(user.role, User.Role.USER)

    def test_create_superuser(self):
        """Test creating a superuser."""
        admin = User.objects.create_superuser(username='admin', email='admin@example.com', password='adminpass')
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)

    def test_user_email_unique(self):
        """Test that user email must be unique."""
        User.objects.create_user(username='u1', email='unique_test@example.com', password='password')
        with self.assertRaises(IntegrityError):
            User.objects.create_user(username='u2', email='unique_test@example.com', password='password')

class UserAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin_api', email='admin_api@test.com', password='password', role=User.Role.ADMIN)
        self.user = User.objects.create_user(username='normal_api', email='normal_api@test.com', password='password', role=User.Role.USER)

    def test_register_user(self):
        """測試註冊 API"""
        url = '/api/v1/auth/register/'
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'password123',
            'password2': 'password123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertEqual(User.objects.filter(username='newuser').count(), 1)

    def test_me_endpoint(self):
        """測試 /me 端點"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'normal_api')

    def test_role_change_permission(self):
        """測試只有管理員可以修改角色"""
        # 一般用戶嘗試提升自己為 ADMIN
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/users/{self.user.id}/'
        data = {'role': 'ADMIN'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 管理員修改角色
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'ADMIN')
