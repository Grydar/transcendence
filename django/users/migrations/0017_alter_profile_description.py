# Generated by Django 5.1.2 on 2024-10-09 13:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0016_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Katarina: The Sinister Blade, a deadly assassin with spinning daggers.'),
        ),
    ]
