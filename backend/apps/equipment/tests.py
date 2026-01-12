from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO
from PIL import Image
from .models import Equipment, Category
from apps.transactions.models import Transaction
from apps.locations.models import Location
from .services import update_equipment_with_transaction
from .serializers import EquipmentSerializer

User = get_user_model()

class EquipmentServiceTests(TestCase):
# ... (keep existing tests) ...
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.category = Category.objects.create(name='Test Category')
        self.equipment = Equipment.objects.create(
            name='Test Equipment',
            category=self.category,
            status=Equipment.Status.AVAILABLE,
            zone='A',
            cabinet='1',
            number='101'
        )

    def test_update_status_to_in_transit_creates_transaction(self):
# ... (keep existing tests) ...
        """Test that changing status to IN_TRANSIT creates a MOVE_START transaction."""
        data = {'status': Equipment.Status.IN_TRANSIT}
        serializer = EquipmentSerializer(self.equipment, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        update_equipment_with_transaction(serializer, self.user)
        
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, Equipment.Status.IN_TRANSIT)
        
        transaction = Transaction.objects.last()
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.action, 'MOVE_START')

class EquipmentAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='apiuser', email='apiuser@example.com', password='password', role=User.Role.USER)
        self.admin = User.objects.create_user(username='adminuser', email='adminuser@example.com', password='password', role=User.Role.ADMIN)
        self.client = APIClient()
        self.category = Category.objects.create(name='API Category')
        self.equipment = Equipment.objects.create(
            name='API Equipment',
            category=self.category,
            status=Equipment.Status.AVAILABLE
        )

    def test_filter_equipment_by_status(self):
# ... (keep existing tests) ...
        """測試按狀態篩選設備"""
        self.client.force_authenticate(user=self.user)
        url = '/api/v1/equipment/'
        
        # 建立另一個不同狀態的設備
        Equipment.objects.create(name='Busy EQ', category=self.category, status=Equipment.Status.BORROWED)
        
        response = self.client.get(url, {'status': 'AVAILABLE'})
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'API Equipment')

    def test_equipment_history_action(self):
# ... (keep existing tests) ...
        """測試設備歷史紀錄端點"""
        Transaction.objects.create(equipment=self.equipment, user=self.user, action='MOVE_START')
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/equipment/{self.equipment.uuid}/history/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_bulk_delete_permission(self):
# ... (keep existing tests) ...
        """測試批量刪除權限"""
        eq2 = Equipment.objects.create(name='Delete Me', category=self.category)
        url = '/api/v1/equipment/bulk-delete/'
        data = {'uuids': [str(self.equipment.uuid), str(eq2.uuid)]}
        
        # 一般用戶應失敗
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 管理員應成功
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Equipment.objects.count(), 0)

    def test_qr_code_endpoint(self):
# ... (keep existing tests) ...
        """測試 QR Code 生成端點"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/equipment/{self.equipment.uuid}/qr/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'image/png')

    def test_image_compression_on_upload(self):
        """測試圖片上傳時是否會自動壓縮並轉為JPEG"""
        self.client.force_authenticate(user=self.admin) # Use admin to allow create/update
        
        # Generate a small blue image (PNG)
        image_file = BytesIO()
        image = Image.new('RGBA', (100, 100), (0, 0, 255))
        image.save(image_file, 'PNG')
        image_file.seek(0)
        
        file = SimpleUploadedFile("test_image.png", image_file.read(), content_type="image/png")
        
        url = f'/api/v1/equipment/{self.equipment.uuid}/'
        # Use multipart/form-data for file upload
        data = {'image': file}
        
        response = self.client.patch(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.equipment.refresh_from_db()
        self.assertTrue(self.equipment.image.name.endswith('.jpg'))
        
        # Verify it's a JPEG
        with self.equipment.image.open() as img_file:
            uploaded_image = Image.open(img_file)
            self.assertEqual(uploaded_image.format, 'JPEG')
