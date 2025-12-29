const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 6545 });

wss.on('connection', function connection(ws) {
    console.log('New client connected');

    ws.on('message', function incoming(message) {
        console.log('Received message:', message);
    });
});

async function broadcastEventTPCreated(eventData) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                event: "TPCreated",
                data: eventData
            });
            client.send(message);
        }
    });
}

async function broadcastEventTPAssigned(eventData) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                event: "TPAssigned",
                data: eventData
            });
            client.send(message);
        }
    });
}

module.exports = {
    broadcastEventTPCreated,
    broadcastEventTPAssigned
}
