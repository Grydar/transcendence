# Generated by Django 5.1.1 on 2024-10-04 20:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Garen: The Might of Demacia, a noble warrior with a powerful spinning strike.'),
        ),
    ]
