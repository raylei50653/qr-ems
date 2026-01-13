from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.common.utils import compress_image

class Transaction(models.Model):
    class Action(models.TextChoices):
        BORROW = 'BORROW', _('Borrow')
        RETURN = 'RETURN', _('Return')
        MAINTENANCE_IN = 'MAINTENANCE_IN', _('Maintenance In')
        MAINTENANCE_OUT = 'MAINTENANCE_OUT', _('Maintenance Out')
        MOVE_START = 'MOVE_START', _('Move Start')
        MOVE_CONFIRM = 'MOVE_CONFIRM', _('Move Confirm')
        DISPATCH = 'DISPATCH', _('Dispatch')

    class Status(models.TextChoices):
        COMPLETED = 'COMPLETED', _('Completed')
        PENDING_APPROVAL = 'PENDING_APPROVAL', _('Pending Approval')
        REJECTED = 'REJECTED', _('Rejected')

    equipment = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.CASCADE,
        related_name='transactions',
        verbose_name=_('Equipment')
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='requested_transactions',
        verbose_name=_('Requester')
    )
    admin_verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_transactions',
        verbose_name=_('Admin Verifier')
    )
    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        verbose_name=_('Action')
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_APPROVAL,
        verbose_name=_('Status')
    )
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Due Date')
    )
    reason = models.TextField(
        blank=True,
        verbose_name=_('Reason')
    )
    admin_note = models.TextField(
        blank=True,
        verbose_name=_('Admin Note')
    )
    # Recorded location info at time of transaction
    location = models.ForeignKey(
        'locations.Location',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('Location')
    )
    zone = models.CharField(max_length=50, blank=True, verbose_name="區")
    cabinet = models.CharField(max_length=50, blank=True, verbose_name="櫃")
    number = models.CharField(max_length=50, blank=True, verbose_name="號")
    
    image = models.ImageField(
        upload_to='transaction_images/',
        blank=True,
        null=True,
        verbose_name=_('Transaction Image')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.action} - {self.equipment.name} by {self.user.username}"

    def save(self, *args, **kwargs):
        # Compress image if it's new or changed
        if self.image:
            try:
                this = Transaction.objects.get(pk=self.pk)
                if this.image != self.image:
                    compressed = compress_image(self.image)
                    if compressed:
                        self.image.save(compressed.name, compressed, save=False)
            except Transaction.DoesNotExist:
                # New instance
                compressed = compress_image(self.image)
                if compressed:
                    self.image.save(compressed.name, compressed, save=False)
        
        super().save(*args, **kwargs)