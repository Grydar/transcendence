# Generated by Django 5.1.1 on 2024-09-30 00:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Jinx: The Loose Cannon, a chaotic marksman with explosive weapons.'),
        ),
    ]
