# Generated by Django 5.1.2 on 2024-10-21 09:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0124_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Jinx: The Loose Cannon, a chaotic marksman with explosive weapons.'),
        ),
    ]