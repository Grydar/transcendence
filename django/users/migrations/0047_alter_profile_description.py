# Generated by Django 5.1.2 on 2024-10-13 11:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0046_alter_profile_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='description',
            field=models.CharField(default='Veigar: The Tiny Master of Evil, a powerful mage with dark magic and a devastating ultimate.'),
        ),
    ]