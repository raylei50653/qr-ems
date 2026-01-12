from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.equipment.models import Equipment, Category
from apps.locations.models import Location
from .models import Transaction

User = get_user_model()

class TransactionAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # 建立測試用戶
        self.admin = User.objects.create_superuser(username='admin', email='admin@test.com', password='password', role=User.Role.ADMIN)
        self.user1 = User.objects.create_user(username='user1', email='user1@test.com', password='password', role=User.Role.USER)
        self.user2 = User.objects.create_user(username='user2', email='user2@test.com', password='password', role=User.Role.USER)
        
        # 建立基礎資料
        self.category = Category.objects.create(name='Electronics')
        self.location = Location.objects.create(name='Lab A')
        self.equipment = Equipment.objects.create(
            name='Oscilloscope',
            category=self.category,
            location=self.location,
            status=Equipment.Status.AVAILABLE,
            zone='Shelf 1',
            cabinet='C1',
            number='001'
        )

    def test_borrow_equipment_success(self):
        """測試成功借用設備"""
        self.client.force_authenticate(user=self.user1)
        url = '/api/v1/transactions/borrow/'
        data = {'equipment_uuid': str(self.equipment.uuid), 'reason': 'Testing'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, Equipment.Status.BORROWED)
        
        # 確認 Transaction 紀錄
        txn = Transaction.objects.get(equipment=self.equipment, action=Transaction.Action.BORROW)
        self.assertEqual(txn.user, self.user1)
        self.assertEqual(txn.status, Transaction.Status.COMPLETED)

    def test_borrow_unavailable_equipment(self):
        """測試借用非可用狀態的設備"""
        self.equipment.status = Equipment.Status.BORROWED
        self.equipment.save()
        
        self.client.force_authenticate(user=self.user1)
        url = '/api/v1/transactions/borrow/'
        data = {'equipment_uuid': str(self.equipment.uuid)}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_return_request_success(self):
        """測試成功發起歸還申請"""
        # 先借用
        Transaction.objects.create(
            equipment=self.equipment, user=self.user1, 
            action=Transaction.Action.BORROW, status=Transaction.Status.COMPLETED
        )
        self.equipment.status = Equipment.Status.BORROWED
        self.equipment.save()
        
        self.client.force_authenticate(user=self.user1)
        url = '/api/v1/transactions/return-request/'
        data = {'equipment_uuid': str(self.equipment.uuid)}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, Equipment.Status.PENDING_RETURN)

    def test_return_request_wrong_user(self):
        """測試非原借用者申請歸還"""
        Transaction.objects.create(
            equipment=self.equipment, user=self.user1, 
            action=Transaction.Action.BORROW, status=Transaction.Status.COMPLETED
        )
        self.equipment.status = Equipment.Status.BORROWED
        self.equipment.save()
        
        # user2 嘗試歸還 user1 借的東西
        self.client.force_authenticate(user=self.user2)
        url = '/api/v1/transactions/return-request/'
        data = {'equipment_uuid': str(self.equipment.uuid)}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_return_by_admin(self):
        """測試管理員核准歸還"""
        # 建立待審核申請
        txn = Transaction.objects.create(
            equipment=self.equipment, user=self.user1, 
            action=Transaction.Action.RETURN, status=Transaction.Status.PENDING_APPROVAL
        )
        self.equipment.status = Equipment.Status.PENDING_RETURN
        self.equipment.save()
        
        new_loc = Location.objects.create(name='Storage B')
        
        self.client.force_authenticate(user=self.admin)
        url = f'/api/v1/transactions/{txn.id}/approve-return/'
        data = {
            'location': str(new_loc.uuid),
            'zone': 'New Zone',
            'cabinet': 'B2',
            'number': '999'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, Equipment.Status.AVAILABLE)
        self.assertEqual(self.equipment.location, new_loc)
        self.assertEqual(self.equipment.number, '999')

    def test_approve_return_permission_denied(self):
        """測試一般用戶嘗試核准申請（應失敗）"""
        txn = Transaction.objects.create(
            equipment=self.equipment, user=self.user1, 
            action=Transaction.Action.RETURN, status=Transaction.Status.PENDING_APPROVAL
        )
        
        self.client.force_authenticate(user=self.user2)
        url = f'/api/v1/transactions/{txn.id}/approve-return/'
        
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
