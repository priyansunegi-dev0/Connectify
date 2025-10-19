// Importing required modules
import express from "express";                          // Web framework for handling routes and middleware
import { createServer } from "node:http";               // Node.js built-in HTTP server to integrate with socket.io
import { Server } from "socket.io";                     // For real-time, bidirectional communication (WebSocket)
import mongoose from "mongoose";                        // ORM for MongoDB for schema-based data modeling
import 'dotenv/config';                                  // To load environment variables from a .env file
import { connectToSocket } from "./controllers/socketManager.js"; // Custom function to handle socket.io setup

import cors from "cors";                                  // Middleware to enable Cross-Origin Resource Sharing
import userRoutes from "./routes/users.routes.js";      // Routes related to user APIs

const app = express();                                  // Create express app instance
const server = createServer(app);                       // Create HTTP server to integrate with socket.io
const io = connectToSocket(server);                     // Connect socket.io to the HTTP server

// Set the port (from env or fallback to 8000)
app.set("port", (process.env.PORT || 8000))

// Middleware to enable CORS for cross-origin requests
app.use(cors()); //helps in allowing requests from different origins

// Middleware to parse incoming JSON payloads
app.use(express.json({ limit: "40kb" })); //prevents payload size issues

// Middleware to parse URL-encoded form data (extended allows nested objects)
app.use(express.urlencoded({ limit: "40kb", extended: true })); //prevents payload size issues

// Mount all user-related routes under /api/v1/users
app.use("/api/v1/users", userRoutes);

// Function to start the server and connect to MongoDB
const start = async () => {
    try {
        // Ensure the MongoDB URI is available
        if (!process.env.MONGODB_URI) {
            console.error("Error: MONGODB_URI is not defined in the .env file.");
            process.exit(1); // Exit the process with an error code
        }

        // Connect to MongoDB Atlas using the URI from environment variables
        const connectionDb = await mongoose.connect(process.env.MONGODB_URI);

        // Log database connection status
        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

        // Start the HTTP server on the specified port
        server.listen(app.get("port"), () => {
            console.log(`LISTENING ON PORT ${app.get('port')}`);
        });
    } catch (error) {
        console.error("Failed to connect to the database or start the server:", error);
        process.exit(1);
    }
}

// Call the start function to initialize everything
start();
