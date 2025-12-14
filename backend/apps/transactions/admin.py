from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'action', 'status', 'equipment', 'user', 'due_date', 'created_at')
    list_filter = ('status', 'action')
    search_fields = ('equipment__name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')