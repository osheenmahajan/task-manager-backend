require("dotenv").config();
const mongoose = require("mongoose");

const testConnection = async () => {
    const uri = process.env.MONGO_URI || process.env.MONGO_URL;
    
    console.log("Testing MongoDB connection...");
    console.log("Connection string:", uri);
    
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        console.log("✅ MongoDB connected successfully!");
        console.log("Host:", conn.connection.host);
        console.log("Database:", conn.connection.name);
        
        // Close the connection
        await mongoose.connection.close();
        console.log("Connection closed successfully");
        
    } catch (error) {
        console.error("❌ MongoDB connection failed:");
        console.error("Error:", error.message);
        console.error("Code:", error.code);
        console.error("Please check:");
        console.error("1. Your connection string format");
        console.error("2. Network connectivity");
        console.error("3. MongoDB server status");
        console.error("4. Firewall settings");
    }
};

testConnection();
