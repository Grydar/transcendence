# Generated by Django 5.1.2 on 2024-10-11 11:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0027_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Lux: The Lady of Luminosity, a light mage with powerful laser attacks.'),
        ),
    ]