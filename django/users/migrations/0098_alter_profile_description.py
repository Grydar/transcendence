# Generated by Django 5.1.2 on 2024-10-15 14:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0097_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Garen: The Might of Demacia, a noble warrior with a powerful spinning strike.'),
        ),
    ]
