# Generated by Django 5.1.2 on 2024-10-10 14:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0015_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Zed: The Master of Shadows, a ninja assassin with shadow clones.'),
        ),
    ]
