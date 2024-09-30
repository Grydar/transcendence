from django.db import models
from django.contrib.auth.models import User

class Party(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    nbPlayer = models.IntegerField(default=1)
    # Add any other fields relevant to a party

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
