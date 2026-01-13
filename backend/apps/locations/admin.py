from django.contrib import admin

from .models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'full_path_display', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('parent',)

    def full_path_display(self, obj):
        return str(obj)

    full_path_display.short_description = 'Full Path'
