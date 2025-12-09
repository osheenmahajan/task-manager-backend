const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/taskmanager';
        
        if (!mongoUri) {
            console.error("MongoDB connection string is missing!");
            // Don't exit, just log the error
            return;
        }
        
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            socketTimeoutMS: 45000, // 45 second timeout
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        console.log("Server will continue running without database connection");
        console.log("Please check your MONGO_URI in .env file");
        // Don't exit the process, let the server continue running
    }
};

module.exports = connectDB;
