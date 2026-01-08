import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

class Location(models.Model):
    uuid = models.UUIDField(
        default=uuid.uuid4, 
        editable=False, 
        primary_key=True, 
        verbose_name=_("Location UUID")
    )
    name = models.CharField(max_length=255, verbose_name=_("Location Name"))
    description = models.TextField(blank=True, verbose_name=_("Description"))
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name=_("Parent Location")
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))

    class Meta:
        verbose_name = _("Location")
        verbose_name_plural = _("Locations")
        ordering = ['name']

    def __str__(self):
        if self.parent:
            return f"{self.parent} > {self.name}"
        return self.name
