# Generated by Django 5.1.2 on 2024-10-15 14:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0099_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Ashe: The Frost Archer, an archer with ice arrows and a hawk scout.'),
        ),
    ]
