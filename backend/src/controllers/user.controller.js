// ==============================
// 📦 Import Required Dependencies
// ==============================

import httpStatus from "http-status"; // Provides readable HTTP status codes (e.g., 200, 404)
import { User } from "../models/user.model.js"; // Mongoose model for User
import bcrypt, { hash } from "bcrypt"; // Library for hashing and comparing passwords securely
import crypto from "crypto"; // Node.js module for generating secure random tokens
import { Meeting } from "../models/meeting.model.js"; // Mongoose model for Meeting

// ====================================
// 🔐 Login Controller
// Purpose: Authenticate a user based on credentials
// When: Called on POST /login
// ====================================

const login = async (req, res) => {
    const { username, password } = req.body;

    // Ensure both fields are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide" });
    }

    try {
        // Check if user exists by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        // Compare provided password with hashed password in DB
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            // Generate a random token using crypto (used for session or user identification)
            const token = crypto.randomBytes(20).toString("hex");

            // Save token to user document
            user.token = token; // This token can be used for future requests to identify the user
            await user.save();

            // Send token as response for future identification
            return res.status(httpStatus.OK).json({ token: token });
        } else {
            // Password does not match
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
        }

    } catch (e) {
        // Handle any unexpected errors
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
};


// ====================================
// 📝 Register Controller
// Purpose: Create a new user account
// When: Called on POST /register
// ====================================

const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        // Check if user with the same username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user object
        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        // Save the new user to the database
        await newUser.save();

        // Respond with success
        res.status(httpStatus.CREATED).json({ message: "User Registered" });

    } catch (e) {
        // Handle any unexpected errors
        res.json({ message: `Something went wrong ${e}` });
    }
};


// ===============================================
// 📖 Get User History Controller
// Purpose: Fetch all meetings a user has joined/created
// When: Called on GET /history?token=xxxx
// ===============================================

const getUserHistory = async (req, res) => {
    const { token } = req.query; // Token passed in query parameter

    try {
        // Find the user by token
        const user = await User.findOne({ token: token });

        // Find all meetings where user_id matches the user's username
        const meetings = await Meeting.find({ user_id: user.username });

        // Return the meeting history
        res.json(meetings);
    } catch (e) {
        // Handle any unexpected errors
        res.json({ message: `Something went wrong ${e}` });
    }
};


// =============================================
// ➕ Add to History Controller
// Purpose: Add a new meeting code to a user's history
// When: Called on POST /add-to-history
// =============================================

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body; // Token and meeting code passed in request body

    try {
        // Find the user by token
        const user = await User.findOne({ token: token });

        // Create a new Meeting entry for the user
        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        // Save the meeting to the database
        await newMeeting.save();

        // Respond with success
        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        // Handle any unexpected errors
        res.json({ message: `Something went wrong ${e}` });
    }
};

// ==========================================
// 📤 Export Controllers for Route Usage
// ==========================================

export { login, register, getUserHistory, addToHistory };// used when we need to use multiple exports from a file
// If only one export is needed, you could use `export default login;` instead
// but here we are exporting multiple controllers, so named export is appropriate
// This allows these functions to be imported in routes or other parts of the application
// e.g., import { login, register } from './controllers/user.controller.js';
// This keeps the code modular and organized, making it easier to maintain and test.
// Each controller function handles a specific route and encapsulates the logic for that route, promoting separation    
