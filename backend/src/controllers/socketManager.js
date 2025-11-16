import { Server } from "socket.io";

// Store connections, messages, and online times
let connections = {};
let messages = {};
let timeOnline = {};

// Main function to connect socket.io to the server
export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Handle new socket connections
    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED", socket.id);

        // Helper to normalize provided path (accepts full URLs or plain IDs)
        const normalizeMeetingKey = (path) => {
            if (!path) return '';
            try {
                if (typeof path === 'string' && path.startsWith('http')) {
                    const u = new URL(path);
                    path = u.pathname;
                }
            } catch (e) {
                // ignore parse errors and treat path as-is
            }
            const parts = String(path).split('/').filter(Boolean);
            return parts.length ? parts[parts.length - 1] : String(path);
        };

        // User joins a call/room
        socket.on("join-call", (path) => {
            const key = normalizeMeetingKey(path);
            if (!messages[key]) messages[key] = [];

            // Join Socket.IO room
            socket.join(key);
            timeOnline[socket.id] = new Date();

            // Build current clients list in the room
            const room = io.sockets.adapter.rooms.get(key);
            const clients = room ? Array.from(room) : [];

            // Notify all users in the room about the new user (send full client list)
            io.to(key).emit("user-joined", socket.id, clients);

            // Send previous messages to the newly joined user
            if (messages[key] && messages[key].length) {
                messages[key].forEach((msg) => {
                    socket.emit("chat-message", msg.data, msg.sender, msg["socket-id-sender"]);
                });
            }
        });

        // Handle signaling for WebRTC
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // Handle chat messages
        socket.on("chat-message", (data, sender) => {
            // Determine rooms (excluding the socket's own room)
            const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
            if (rooms.length === 0) return;

            // For each room, persist and broadcast message
            rooms.forEach((roomKey) => {
                if (!messages[roomKey]) messages[roomKey] = [];
                messages[roomKey].push({
                    sender,
                    data,
                    "socket-id-sender": socket.id
                });
                console.log("message", roomKey, ":", sender, data);

                // Broadcast message to all users in the room
                io.to(roomKey).emit("chat-message", data, sender, socket.id);
            });
        });

        // Notify room members before disconnect (use disconnecting to get rooms)
        socket.on("disconnecting", () => {
            const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
            rooms.forEach((roomKey) => {
                // Notify others in the room
                socket.to(roomKey).emit("user-left", socket.id);
            });
        });

        // Handle final disconnect cleanup
        socket.on("disconnect", () => {
            delete timeOnline[socket.id];
        });
    });

    return io;
};