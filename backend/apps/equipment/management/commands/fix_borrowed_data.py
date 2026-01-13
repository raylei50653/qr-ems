from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.equipment.models import Equipment
from apps.transactions.models import Transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Fixes missing borrow transactions for equipment marked as BORROWED'

    def handle(self, *args, **kwargs):
        # 1. Get or Create a Test User
        user, created = User.objects.get_or_create(username="test_borrower")
        if created:
            user.set_password("testpass123")
            user.email = "test@example.com"
            user.role = User.Role.USER
            user.save()
            self.stdout.write(f"Created test user: {user.username}")
        else:
            self.stdout.write(f"Using existing user: {user.username}")

        # 2. Find Equipment with status 'BORROWED'
        borrowed_equipments = Equipment.objects.filter(status=Equipment.Status.BORROWED)
        
        self.stdout.write(f"Found {borrowed_equipments.count()} borrowed equipment items.")

        for eq in borrowed_equipments:
            # Check if there is already an active borrow transaction
            # We assume the latest transaction for this equipment should be the borrow record
            last_transaction = Transaction.objects.filter(equipment=eq).order_by('-created_at').first()

            if last_transaction and last_transaction.action == Transaction.Action.BORROW and last_transaction.status == Transaction.Status.COMPLETED:
                self.stdout.write(f"Equipment {eq.name} already has a valid transaction. Skipping.")
                continue
            
            # 3. Create a Transaction record
            self.stdout.write(f"Fixing {eq.name} (UUID: {eq.uuid})... Creating Borrow Transaction.")
            
            Transaction.objects.create(
                equipment=eq,
                user=user,
                action=Transaction.Action.BORROW,
                status=Transaction.Status.COMPLETED,  # Effectively borrowed
                due_date=timezone.now() + timedelta(days=7),
                reason="Auto-generated transaction for test data",
                # admin_verifier could be None or assigned if needed
            )

        self.stdout.write(self.style.SUCCESS("Fix complete."))
