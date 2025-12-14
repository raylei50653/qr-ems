from django.contrib import admin
from .models import Equipment, Attachment

class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 1

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'uuid', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'description')
    readonly_fields = ('uuid', 'created_at', 'updated_at')
    inlines = [AttachmentInline]