const mongoose = require('mongoose');
const { Schema }= require('mongoose');

const messageSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    group: {
        type:Schema.Types.ObjectId,
        ref: "Group",
        required: true
    }
}, {timestamps: true});

const Messages = mongoose.model('Message', messageSchema)
module.exports = Messages;