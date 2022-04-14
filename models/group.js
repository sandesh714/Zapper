const mongoose = require('mongoose');
const { Schema }= require('mongoose');

const groupSchema = new Schema({
    name: {
        type:String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    members:{
        type: [String],
        required: true
    },
    messages: {
        type: Schema.Types.ObjectId,
        ref: "Messages"
    },
    description:{
        type: String
    }
}, {timestamps: true});

const Groups = mongoose.model('Groups', groupSchema)
module.exports = Groups;