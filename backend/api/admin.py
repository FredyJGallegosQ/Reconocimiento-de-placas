from django.contrib import admin
from .models import CustomUser, RegisteredPlate

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'password', 'is_admin', 'is_user')
    search_fields = ('username',)

@admin.register(RegisteredPlate)
class RegisteredPlateAdmin(admin.ModelAdmin):
    list_display = ('plate_number', 'name', 'last_name', 'occupation', 'registered_at')
    search_fields = ('plate_number', 'name')
    list_filter = ('occupation', 'registered_at')