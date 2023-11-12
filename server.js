const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const rooms = {};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    socket.on('joinRoom', (roomId) => {
        console.log(`User ${socket.id} joined room ${roomId}`);

        socket.join(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = {lines: [], users: []};
        }
        // Відправляємо стан дошки новому користувачеві
        console.log("Відправляємо йому дошку довжини" + rooms[roomId].lines.length)
        socket.emit('initBoard', rooms[roomId].lines);

        rooms[roomId].users.push(socket.id);
    });

    socket.on('leaveRoom', () => {
        for (const roomId in rooms) {
            const index = rooms[roomId].users.indexOf(socket.id);
            if (index !== -1) {
                rooms[roomId].users.splice(index, 1);
                break;
            }
        }
    });

    socket.on('draw', (data, roomId) => {
        // Зберігаємо новий стан дошки
        if (rooms[roomId]) {
            rooms[roomId].lines = data
            console.log("[EXIST UPDATED] Lines for roomId = " + roomId + ", data length is " + rooms[roomId].lines.length)
        } else {
            rooms[roomId] = {lines: [], users: [socket.id]};
            rooms[roomId].lines = data
            io.to(roomId).emit('draw', rooms[roomId].lines, roomId);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        for (const roomId in rooms) {
            const index = rooms[roomId].users.indexOf(socket.id);
            if (index !== -1) {
                rooms[roomId].users.splice(index, 1);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
