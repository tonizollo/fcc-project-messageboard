// MessageBoard database schema and model

const mongoose = require('mongoose');

// Define reply sub-schema
const replySchema = new mongoose.Schema({
    "text": {
        type: String,
        required: true
    },
    "delete_password": {
        type: String,
        required: true
    },
    "reported": {
        type: Boolean,
        default: false  // This sets the default value to false
    },
}, 
    { timestamps: true }
); 

// Define message board schema
const messageBoardSchema = new mongoose.Schema({
    "board": {
        type: String,
        required: true
    },
    "text": {
        type: String,
        required: true
    },
    "delete_password": {
        type: String,
        required: true
    },
    "reported": {
        type: Boolean,
        default: false  // This sets the default value to false
    },
    "replies": [replySchema]
  },
    { timestamps: true }    // This enables automatic createdAt and updatedAt fields
); 

const MessageBoard = mongoose.model('MessageBoard', messageBoardSchema);

module.exports = MessageBoard;