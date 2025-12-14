from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    email = models.EmailField(_("email address"), blank=False, null=True, unique=True)
    
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MANAGER = 'MANAGER', 'Manager'
        USER = 'USER', 'User'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        verbose_name="角色"
    )
    avatar_url = models.URLField(blank=True, null=True, verbose_name="頭像URL")

    class Meta:
        verbose_name = "使用者"
        verbose_name_plural = "使用者列表"

    def __str__(self):
        return self.username