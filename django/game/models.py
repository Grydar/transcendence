from django.db import models
from django.contrib.auth.models import User

class Party(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    num_players = models.IntegerField(choices=[(2, '2 Players'), (3, '3 Players')], default=2)
    nbPlayer = models.IntegerField(default=0)  # Start with 1 since the creator joins immediately
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('in_progress', 'In Progress'), ('completed', 'Completed')],
        default='active'
    )

    def __str__(self):
        return f"Party {self.id} by {self.creator.username}"

    class Meta:
        db_table = 'game_party'  # Custom table name

class LeaderboardEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    party = models.ForeignKey(Party, on_delete=models.CASCADE)
    player_score = models.IntegerField()
    opponent_score = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.player_score} vs {self.opponent_score} at {self.timestamp}"
