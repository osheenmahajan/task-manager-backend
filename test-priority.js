const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Connected');
    mongoose.connection.db.collection('tasks').aggregate([
        {$group: {_id: '$priority', count: {$sum: 1}}}
    ]).toArray().then(result => {
        console.log('Priority distribution:', JSON.stringify(result));
        mongoose.connection.close();
    });
}).catch(err => console.error(err));
