const mongoose = require('mongoose');
const { Schema }= require('mongoose');

const groupSchema = new Schema({
    name: {
        type:String,
        required: true
    },
    members:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    messages: {
        type: Schema.Types.ObjectId,
        ref: "Messages"
    }
}, {timestamps: true});

const Groups = mongoose.model('Groups', groupSchema)
module.exports = Groups;