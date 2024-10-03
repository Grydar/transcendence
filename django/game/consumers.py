# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Nommer un groupe unique pour chaque utilisateur ou chaque salle de jeu
        self.party_id = self.scope['url_route']['kwargs']['party_id']
        self.room_group_name = f'pong_{self.party_id}'
        # Récupérer l'ID de l'utilisateur s'il est authentifié
        user_id = None
        if self.scope['user'].is_authenticated:
            user_id = self.scope['user'].id  # Utiliser l'ID de l'utilisateur authentifié

        # Joindre le groupe
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        await self.send(text_data=json.dumps({
            'message': 'You are connected!',
            'user_id': user_id  # Envoi de l'identifiant unique de la connexion
        }))


    async def disconnect(self, close_code):
        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recevoir un message du WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data['action']  # par exemple 'move_paddle', 'start_game'
        user_id = data.get('user_id')

        # Envoyer le message au groupe
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_message',
                'action': action,
                'user_id': data.get('user_id')
            }
        )

    # Recevoir un message du groupe et envoyer au WebSocket
    async def game_message(self, event):
        action = event['action']
        user_id = event['user_id']

        # Envoyer le message au WebSocket
        await self.send(text_data=json.dumps({
            'action': action,
            'user_id': user_id,
        }))
