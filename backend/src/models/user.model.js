// Importing mongoose and Schema constructor
import mongoose, { Schema } from "mongoose";

// Defining the schema for a User
// Why: Schema defines the structure of documents in the MongoDB 'users' collection
const userScheme = new Schema(
    {
        // User's full name — required
        name: { type: String, required: true },

        // Unique username for login or display — required and must be unique
        username: { type: String, required: true, unique: true },

        // Hashed password — required for authentication
        password: { type: String, required: true },

        // Token (optional) — used for session/authentication (e.g., JWT)
        token: { type: String }
    }
);

// Creating the User model from the schema
// Why: This model lets you interact with the 'users' collection in MongoDB
const User = mongoose.model("User", userScheme);

// Exporting the User model so it can be used in routes, controllers, etc.
export { User };
