from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Equipment, Category
from apps.transactions.models import Transaction
from .services import update_equipment_with_transaction
from .serializers import EquipmentSerializer

User = get_user_model()

class EquipmentServiceTests(TestCase):
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
        self.assertEqual(transaction.equipment, self.equipment)
        self.assertEqual(transaction.user, self.user)

    def test_update_status_to_available_creates_transaction(self):
        """Test that changing status from IN_TRANSIT to AVAILABLE creates a MOVE_CONFIRM transaction."""
        self.equipment.status = Equipment.Status.IN_TRANSIT
        self.equipment.save()
        
        data = {'status': Equipment.Status.AVAILABLE}
        serializer = EquipmentSerializer(self.equipment, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        update_equipment_with_transaction(serializer, self.user)
        
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, Equipment.Status.AVAILABLE)
        
        transaction = Transaction.objects.last()
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.action, 'MOVE_CONFIRM')

    def test_direct_location_update_creates_transaction(self):
        """Test that changing location details directly creates a MOVE_CONFIRM transaction."""
        data = {'zone': 'B', 'cabinet': '2', 'number': '202'}
        serializer = EquipmentSerializer(self.equipment, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        update_equipment_with_transaction(serializer, self.user)
        
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.zone, 'B')
        
        transaction = Transaction.objects.last()
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.action, 'MOVE_CONFIRM')
        self.assertEqual(transaction.reason, 'Direct location update')

    def test_non_location_update_does_not_create_transaction(self):
        """Test that changing description does NOT create a transaction."""
        data = {'description': 'Updated description'}
        serializer = EquipmentSerializer(self.equipment, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        update_equipment_with_transaction(serializer, self.user)
        
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.description, 'Updated description')
        
        self.assertEqual(Transaction.objects.count(), 0)

class EquipmentAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='apiuser', password='password')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name='API Category')
        self.equipment = Equipment.objects.create(
            name='API Equipment',
            category=self.category,
            status=Equipment.Status.AVAILABLE
        )

    def test_update_equipment_api(self):
        """Test the update API endpoint uses the service correctly."""
        url = f'/api/v1/equipment/{self.equipment.uuid}/'
        data = {'status': Equipment.Status.IN_TRANSIT}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, Equipment.Status.IN_TRANSIT)
        
        # Verify transaction was created via the service integration
        transaction = Transaction.objects.last()
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.action, 'MOVE_START')