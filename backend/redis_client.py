from typing import Any, Optional

import redis.asyncio as aioredis


class RedisManager:
    def __init__(self, host, port, db):
        self.connection = aioredis.Redis(host=host,
                                         port=port,
                                         db=db,
                                         auto_close_connection_pool=False)

    async def get(self, key: str):
        async with self.connection as conn:
            return await conn.get(key)

    async def delete(self, key: str):
        async with self.connection as conn:
            return await conn.delete(key)

    async def hset(self, hash_name: str, key: str, value: Any):
        async with self.connection as conn:
            return await conn.hsetnx(hash_name, key, value)

    async def hget(self, hash_name: str, key: str) -> str:
        async with self.connection as conn:
            return await conn.hget(hash_name, key)

    async def hgetall(self, hash_name: str) -> dict:
        async with self.connection as conn:
            return await conn.hgetall(hash_name)

    async def exists(self, hash_name: str) -> bool:
        async with self.connection as conn:
            return await conn.exists(hash_name)

    async def hdel(self, hash_name: str, *keys):
        async with self.connection as conn:
            return await conn.hdel(hash_name, *keys)

    async def publish(self, connection_id, data):
        await self.connection.publish(connection_id, data)

    async def increment(self, key: str, amount=1):
        async with self.connection as conn:
            await conn.incrby(key, amount=amount)

    async def decrement(self, key: str, amount=1):
        async with self.connection as conn:
            await conn.decr(key, amount=amount)

    async def remove(self, key: str):
        async with self.connection as conn:
            return await conn.delete(key)

    async def set(self, key: str, value: Any):
        async with self.connection as conn:
            await conn.set(key, value)

    async def subscribe(self, channel):
        pubsub = self.connection.pubsub()
        await pubsub.subscribe(channel)
        return pubsub

    async def close(self):
        await self.connection.close()


class RedisContextManager:
    def __init__(self, host='localhost', port=6379, db=0):
        self.host = host
        self.port = port
        self.db = db
        self.redis: Optional[RedisManager] = RedisManager(host=self.host, port=self.port, db=self.db)

    async def __aenter__(self):
        await self.redis.connection
        return self.redis

    async def __aexit__(self, exc_type, exc_value, traceback):
        if self.redis is not None:
            print("Closing connection")
            await self.redis.close()
