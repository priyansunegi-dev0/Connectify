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
        }
    });

    // Handle new socket connections
    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED");

        // User joins a call/room
        socket.on("join-call", (path) => {
            if (!connections[path]) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Notify all users in the room about the new user
            connections[path].forEach((id) => {
                io.to(id).emit("user-joined", socket.id, connections[path]); // Notify others in the room
            });

            // Send previous messages to the newly joined user
            if (messages[path]) {
                messages[path].forEach((msg) => {
                    io.to(socket.id).emit(
                        "chat-message",
                        msg.data,
                        msg.sender,
                        msg["socket-id-sender"]
                    );
                });
            }
        });

        // Handle signaling for WebRTC
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // Handle chat messages
        socket.on("chat-message", (data, sender) => {
            // Find the room the sender is in
            const [matchingRoom, found] = Object.entries(connections).reduce(
                ([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                },
                ["", false]
            );

            if (found) {
                if (!messages[matchingRoom]) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({
                    sender,
                    data,
                    "socket-id-sender": socket.id
                });
                console.log("message", matchingRoom, ":", sender, data);

                // Broadcast message to all users in the room
                connections[matchingRoom].forEach((id) => {
                    io.to(id).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        // Handle user disconnect
        socket.on("disconnect", () => {
            const diffTime = Math.abs(timeOnline[socket.id] - new Date());
            let key;

            // Find and remove the disconnected user from all rooms
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k;

                        // Notify others in the room
                        connections[key].forEach((id) => {
                            io.to(id).emit('user-left', socket.id);
                        });

                        // Remove user from room
                        const index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);

                        // Delete room if empty
                        if (connections[key].length === 0) {
                            delete connections[key];
                        }
                    }
                }
            }
        });
    });

    return io;
};