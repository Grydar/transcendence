# Generated by Django 5.1.2 on 2024-10-09 12:55

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0002_leaderboardentry_party_delete_mapsettings_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='leaderboardentry',
            name='opponent',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='opponent_entries', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='party',
            name='num_players',
            field=models.IntegerField(choices=[(2, '2 Players'), (3, '3 Players')], default=2),
        ),
        migrations.AddField(
            model_name='party',
            name='status',
            field=models.CharField(choices=[('active', 'Active'), ('in_progress', 'In Progress'), ('completed', 'Completed')], default='active', max_length=20),
        ),
        migrations.AlterField(
            model_name='leaderboardentry',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='leaderboard_entries', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='party',
            name='nbPlayer',
            field=models.IntegerField(default=0),
        ),
    ]
