# Generated by Django 5.1.2 on 2024-10-21 14:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0106_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Yasuo: The Unforgiven, a swordsman with wind-based abilities and a powerful ultimate.'),
        ),
    ]
