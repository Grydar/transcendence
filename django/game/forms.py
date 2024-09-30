# game/forms.py

from django import forms
from .models import Party

class CreatePartyForm(forms.ModelForm):
    class Meta:
        model = Party
        fields = ['nbPlayer']
        labels = {
            'nbPlayer': 'Number of players'
        }

