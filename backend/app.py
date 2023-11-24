import json

import uvicorn
from fastapi import FastAPI, Depends
from starlette.websockets import WebSocket

from manage_session import ManageSession, SessionException, MessageContainer, MessageType

app = FastAPI()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()  # Accept the WebSocket connection

    while True:
        data = await websocket.receive_text()  # Receive a message from the client
        await websocket.send_text(f"Message text was: {data}")  # Send a response back to the client


@app.websocket("/ws/create_session/{user_id}/{channel_id}")
async def create_game_session(
        websocket: WebSocket,
        user_id: str,
        channel_id: str,
        manage_session: ManageSession = Depends(ManageSession)
):
    try:
        await manage_session.create_game_session(channel_id=channel_id, user_id=user_id, websocket=websocket)
        while True:
            data = await websocket.receive_text()
            await manage_session.publish_message(channel_id, data)
    except SessionException as e:
        await websocket.send_text(json.dumps(MessageContainer(message_type=MessageType.ExceptionOccurred,
                                                              sender_user_id=user_id, channel_id=channel_id,
                                                              message=e.message).__dict__))
    except Exception as e:
        await manage_session.publish_message(channel_id, json.dumps(
            MessageContainer(message_type=MessageType.RemoveUser, sender_user_id=user_id, channel_id=channel_id,
                             message=f"User: {user_id} ended the game").__dict__))
    finally:
        await websocket.close()


@app.websocket("/ws/manage_session/{user_id}/{channel_id}")
async def manage_game_session(
        websocket: WebSocket,
        user_id: str,
        channel_id: str,
        manage_session: ManageSession = Depends(ManageSession)
):
    try:
        print(f"Manage game {user_id} and channel id {channel_id}")
        await manage_session.add_user_to_game_session(channel_id=channel_id, user_id=user_id, websocket=websocket)
        while True:
            data = await websocket.receive_text()
            await manage_session.publish_message(channel_id, data)
    except SessionException as e:
        print("Session exception was thrown")
        await websocket.send_text(json.dumps(MessageContainer(message_type=MessageType.ExceptionOccurred,
                                                              sender_user_id=user_id, channel_id=channel_id,
                                                              message=e.message).__dict__))
    except Exception:
        await manage_session.publish_message(channel_id, json.dumps(
            MessageContainer(message_type=MessageType.RemoveUser, sender_user_id=user_id, channel_id=channel_id,
                             message=f"User: {user_id} after left the room").__dict__))
    finally:
        await websocket.close()


# See PyCharm help at https://www.jetbrains.com/help/pycharm/

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
