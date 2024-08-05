import asyncio
from aiohttp import web
import json

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == web.WSMsgType.text:
            data = json.loads(msg.data)
            # Maneja el peerData aquí. Enviar datos de vuelta si es necesario.
            await ws.send_str(json.dumps(data))

    return ws

app = web.Application()
app.router.add_get('/ws', websocket_handler)

if __name__ == '__main__':
    web.run_app(app, port=8080)