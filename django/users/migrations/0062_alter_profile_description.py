# Generated by Django 5.1.2 on 2024-10-13 13:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0061_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Darius: The Hand of Noxus, a brutal warrior with a deadly axe.'),
        ),
    ]
