# Generated by Django 5.1.2 on 2024-10-21 10:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0137_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Ahri: The Nine-Tailed Fox, a mage with charm and spirit fire abilities.'),
        ),
    ]
