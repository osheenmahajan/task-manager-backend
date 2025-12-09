const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB connection...');

// Check if MongoDB URI is configured
const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/taskmanager';
console.log(`🔗 Using connection string: ${mongoUri}`);

// Test connection
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB is connected successfully!');
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
    console.log(`🏠 Database: ${mongoose.connection.name}`);
    console.log(`🖥️  Host: ${mongoose.connection.host}`);
    
    // Close connection
    mongoose.connection.close();
    process.exit(0);
})
.catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
});
