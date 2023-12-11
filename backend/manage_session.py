import asyncio
import json
from dataclasses import dataclass
from enum import IntEnum
from typing import Optional, Dict, List

from fastapi import Depends
from redis.asyncio.client import PubSub
from starlette.websockets import WebSocket

from redis_client import RedisContextManager, RedisManager


class ExceptionCode(IntEnum):
    DoesNotExist = 1
    Duplicate = 2
    SessionEnded = 3


class SessionException(Exception):
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


class MessageType(IntEnum):
    Request = 0
    SendMessage = 1
    RemoveUser = 2
    AcceptRequest = 3
    DeclineRequest = 4
    ExceptionOccurred = 5


class PlayerRole(IntEnum):
    Owner = 0
    Player = 1


@dataclass
class Player:
    user_id: str
    websocket_instance: WebSocket


@dataclass
class MessageContainer:
    sender_user_id: str
    sender_role: PlayerRole
    message_type: MessageType
    channel_id: str
    message: Optional[str] = None


class ManageSession:
    def __init__(self, redis_context_manager: RedisContextManager = Depends(RedisContextManager)):
        self.web_socket_instance: Optional[WebSocket] = None
        self.channels: Dict[str, List[Player]] = dict()
        self.redis_context_manager = redis_context_manager

    async def add_user_to_game_session(self, channel_id: str, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self.redis_context_manager as redis_client:
            is_channel_exists = await redis_client.exists(channel_id)
            if not is_channel_exists:
                raise SessionException(ExceptionCode.DoesNotExist, "Unable to find channel")
            await redis_client.hset(channel_id, user_id, json.dumps({'role': PlayerRole.Player, 'is_approved': False}))
            payload = MessageContainer(message_type=MessageType.Request, sender_user_id=user_id, channel_id=channel_id,
                                       message=f'User: {user_id} is requesting to join the game', sender_role=PlayerRole.Player)
            await self.publish_message(channel_id, user_id, json.dumps(payload.__dict__))
            self.web_socket_instance = websocket
            pubsub_subscriber: PubSub = await redis_client.subscribe(channel_id)
            asyncio.create_task(self.manage_players_session(redis_client, channel_id, user_id, pubsub_subscriber,
                                                            web_socket_instance=websocket))

    # async def join_session
    async def create_game_session(self, channel_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self.redis_context_manager as redis_client:
            is_channel_exists = await redis_client.exists(channel_id)
            if is_channel_exists:
                raise SessionException(ExceptionCode.Duplicate, "Duplicate channel already exist")
            await redis_client.hset(channel_id, user_id, json.dumps({'role': PlayerRole.Owner, 'is_approved': True}))
            pubsub_subscriber: PubSub = await redis_client.subscribe(channel_id)
            self.web_socket_instance = websocket
            asyncio.create_task(self.manage_players_session(redis_client, channel_id, user_id, pubsub_subscriber,
                                                            web_socket_instance=websocket))

    async def publish_message(self, channel_id: str, user_id: str, data: str):
        async with self.redis_context_manager as redis_client:
            user_payload_byte = await redis_client.hget(channel_id, user_id)
            if not user_payload_byte:
                print("User was not found.")
                return
            user_payload = json.loads(user_payload_byte)
            payload = json.loads(data)
            role = user_payload['role']
            if role == PlayerRole.Owner and payload['message_type'] == MessageType.AcceptRequest:
                # Approve user after accepting the request.
                recipient_payload_byte = await redis_client.hget(channel_id, payload.get('recipient_user_id'))
                if not recipient_payload_byte:
                    return
                recipient_payload = json.loads(recipient_payload_byte)
                recipient_payload['is_approved'] = True
                await redis_client.hset(channel_id, user_id, json.dumps(recipient_payload))
            await redis_client.publish(channel_id, data)
            print(f"Done publishing")

    async def manage_players_session(self, redis_client: RedisManager, channel_id: str, user_id: str,
                                     pubsub_subscriber: PubSub, web_socket_instance: WebSocket):
        print(f"Started the task {channel_id}")
        while True:
            user_payload = await redis_client.hget(channel_id, user_id)
            if user_payload:
                user_payload = json.loads(user_payload)
                message = await pubsub_subscriber.get_message(ignore_subscribe_messages=True)
                if message is not None:
                    raw_message = message['data']
                    payload = json.loads(raw_message)
                    current_role = user_payload['role']
                    if payload['message_type'] == MessageType.RemoveUser:
                        # Notify the websocket with the remove request payload.
                        if payload['sender_user_id'] != user_id:
                            await web_socket_instance.send_text(json.dumps(payload))
                    elif payload['message_type'] == MessageType.Request:
                        if current_role == PlayerRole.Owner:
                            await web_socket_instance.send_text(json.dumps(payload))
                    elif payload['message_type'] in [MessageType.DeclineRequest,
                                                     MessageType.AcceptRequest] and payload.get(
                            'recipient_user_id') == user_id:
                        await web_socket_instance.send_text(json.dumps(payload))
                    elif payload['message_type'] == MessageType.SendMessage and payload.get(
                            'sender_user_id') != user_id and payload.get('is_approved', False):
                        await web_socket_instance.send_text(json.dumps(payload))
            else:
                print("Manage player session", user_id, channel_id)
                break
