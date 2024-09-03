from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission

class CustomUser(AbstractUser):
    is_admin = models.BooleanField(default=False)
    is_user = models.BooleanField(default=True)
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_groups',  
        blank=True,
        help_text='The groups this user belongs to.',
        related_query_name='custom_user',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_permissions', 
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='custom_user',
    )

    def __str__(self):
        return self.username

class RegisteredPlate(models.Model):
    plate_number = models.CharField(max_length=7, unique=True)
    name = models.CharField(max_length=40)
    last_name = models.CharField(max_length=50)
    occupation = models.CharField(max_length=50)
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.plate_number