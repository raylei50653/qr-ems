import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.utils import compress_image


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='類別名稱')
    description = models.TextField(blank=True, verbose_name='描述')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '設備類別'
        verbose_name_plural = '設備類別列表'

    def __str__(self):
        return self.name


class Equipment(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        BORROWED = 'BORROWED', 'Borrowed'
        PENDING_BORROW = 'PENDING_BORROW', 'Pending Borrow'
        PENDING_RETURN = 'PENDING_RETURN', 'Pending Return'
        PENDING_DISPATCH = 'PENDING_DISPATCH', 'Pending Dispatch'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'
        TO_BE_MOVED = 'TO_BE_MOVED', 'To Be Moved'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        LOST = 'LOST', 'Lost'
        DISPATCHED = 'DISPATCHED', 'Dispatched'
        DISPOSED = 'DISPOSED', 'Disposed'

    uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, primary_key=True, verbose_name='設備UUID'
    )
    name = models.CharField(max_length=255, verbose_name='設備名稱')
    description = models.TextField(blank=True, verbose_name='描述')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
        verbose_name='狀態',
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipment',
        verbose_name='類別',
    )

    # Location Information
    location = models.ForeignKey(
        'locations.Location',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipment',
        verbose_name='存儲位置',
    )
    target_location = models.ForeignKey(
        'locations.Location',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='targeted_equipment',
        verbose_name='目標位置',
    )
    zone = models.CharField(max_length=50, blank=True, verbose_name='區')
    cabinet = models.CharField(max_length=50, blank=True, verbose_name='櫃')
    number = models.CharField(max_length=50, blank=True, verbose_name='號')

    target_zone = models.CharField(max_length=50, blank=True, verbose_name='目標區')
    target_cabinet = models.CharField(max_length=50, blank=True, verbose_name='目標櫃')
    target_number = models.CharField(max_length=50, blank=True, verbose_name='目標號')

    # Equipment Image
    image = models.ImageField(
        upload_to='equipment_images/', blank=True, null=True, verbose_name='設備圖片'
    )

    rdf_metadata = models.JSONField(default=dict, blank=True, verbose_name='RDF元數據')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')

    class Meta:
        verbose_name = '設備'
        verbose_name_plural = '設備列表'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Compress image if it's new or changed
        if self.image:
            # Check if this is a new instance or image has changed
            try:
                this = Equipment.objects.get(pk=self.pk)
                if this.image != self.image:
                    compressed = compress_image(self.image)
                    if compressed:
                        self.image.save(compressed.name, compressed, save=False)
            except Equipment.DoesNotExist:
                # New instance
                compressed = compress_image(self.image)
                if compressed:
                    self.image.save(compressed.name, compressed, save=False)

        super().save(*args, **kwargs)


class Attachment(models.Model):
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('Equipment'),
    )
    file = models.FileField(upload_to='attachments/', verbose_name=_('File'))
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Attachment for {self.equipment.name}'
