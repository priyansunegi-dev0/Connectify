// Importing mongoose and Schema constructor
import mongoose, { Schema } from "mongoose";

// Defining the schema for a Meeting
// Why: Schema defines the structure of documents in the 'meetings' collection
const meetingSchema = new Schema(
    {
        // The ID of the user who created or is associated with the meeting
        // Stored as a string (could also be ObjectId in future if referencing User model)
        user_id: { type: String },

        // Unique code for the meeting — required
        // Used to identify or join a meeting
        meetingCode: { type: String, required: true },

        // Date of the meeting — required
        // Defaults to the current date/time when the document is created
        date: { type: Date, default: Date.now, required: true }
    }
);

// Creating the Meeting model from the schema
// Why: This allows you to interact with the 'meetings' collection in MongoDB
const Meeting = mongoose.model("Meeting", meetingSchema);

// Exporting the Meeting model so it can be used in other parts of the application
export { Meeting }; //used when we need to use multiple exports from a file
// If only one export is needed, you could use `export default Meeting;` instead
// but here we are exporting multiple models, so named export is appropriate
