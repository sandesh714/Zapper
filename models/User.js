const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: [true, 'Username is required']
    },
    email:{
        type:String,
        required:[false ,'Email is not required']
    },
    pending_requests: {
        type:[String],
        required:false
    },
    friend_list:{
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    friend_requests: {
        type: [String],
        required: false
    },
    password:{
        type:String,
        required: [true, 'Password is required']
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User;