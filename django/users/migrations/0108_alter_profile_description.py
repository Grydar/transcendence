# Generated by Django 5.1.2 on 2024-10-21 14:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0107_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Teemo: The Swift Scout, a yordle with poisonous darts and stealth.'),
        ),
    ]
