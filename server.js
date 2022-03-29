require('dotenv').config();
const express = require('express');
const socket = require('socket.io');
const http = require('http');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const User = require('./models/User');
const Message = require('./models/messages');
const Group = require('./models/group');
const bcrypt = require('bcryptjs')
const {
    checkAuthenticated,
    checkNotAuthenticated
} = require('./middlewares/auth');
const formatmessage = require('./utils/messages');

const botname = "Zapper Bot";
const app = express();
const server = http.createServer(app);
const io = socket(server);




// var userlists = async() =>{
//     await User.find({}).sort().then(users=>{
//         users.forEach(user => {
//             userlist.push(user.username);
//         })
//         return userlist;
//     })
// } 
// var grouplists = async() => {
//     Group.find({}).sort().then(groups => {
//     groups.forEach(group => {
//         grouplist.push(group.name);
//     })
//     console.log(grouplist);
//     return grouplist;
// })
// }
//     console.log(userlist)
// })

// console.log(userlist)




const initializePassport = require('./passport-config');
const { emit } = require('process');
const { join } = require('path');
initializePassport(
    passport,
    async(username) => {
        const userFound = await User.findOne({ username });
        return userFound;
    },
    async(id) => {
        const userFound = await User.findOne({ _id:id });
        return userFound;
    }

);


const PORT = 3000;



app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized:false,
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static('public'));


app.get('/',checkNotAuthenticated,(req,res)=>{
    res.render('login');

})

app.get('/register',checkNotAuthenticated, (req,res)=>{
    res.render('register');
})

// app.get('/get_users', checkAuthenticated, (req, res)=>{
//     User.find({}).sort().then(users=>{
//         users.forEach(user => {
//             res.render(user.username);
//             //console.log(userlist);
//         })
// })

app.get('/index', checkAuthenticated, async(req, res) => {
    let userlist = [];
    let grouplist = [];
    let userlists = await User.find({}).sort().then(users=>{
        users.forEach(user => {
            userlist.push(user.username);
        })
        return userlist;
    })
    let grouplists = await Group.find({}).sort().then(groups => {
        groups.forEach(group => {
            grouplist.push(group.name);
        })
        console.log(grouplist);
        return grouplist;
    })
    res.render('index', { data: { user : req.user, users: userlists, groups: grouplists}});
})


app.get('/chat',checkAuthenticated,async (req, res)=>{
    let userlist = [];
    let grouplist = [];
    let userlists = await User.find({}).sort().then(users=>{
        users.forEach(user => {
            userlist.push(user.username);
        })
        return userlist;
    })
    let grouplists = await Group.find({}).sort().then(groups => {
        groups.forEach(group => {
            grouplist.push(group.name);
        })
        console.log(grouplist);
        return grouplist;
    })
    res.render('chat', { data: { user : req.user, users: userlists, groups: grouplists}});
})

app.get('/edit_profile', checkAuthenticated, (req, res) => {
    res.render('edit_profile');
})

app.get('/add_friends', checkAuthenticated, (req, res) =>{
    res.render('add_friends');
})

app.get('/add_groups', checkAuthenticated, (req,res)=>{
    res.render('add_groups');
})

app.post('/', checkNotAuthenticated, passport.authenticate('local',{
    successRedirect: '/index',
    failureRedirect: '/',
    failureFlash: true,
}))

app.post('/edit_profile', checkAuthenticated, async(req, res) =>{
    var username1 = req.body.username;
    var emailconf = req.body.email;
    await User.updateOne({email: emailconf},{$set: {username:username1}});

    res.redirect('/');
})

app.post('/register', checkNotAuthenticated, async(req, res)=>{
    const userFound = await User.findOne({email: req.body.email});
    const unameFound = await User.findOne({username: req.body.username});

    if(userFound){
        req.flash('error', 'User with that email already exists');
        res.redirect('/register');
    }else if(unameFound){
        req.flash('error', 'User with that username already exists');
        res.redirect('/register');
    }
    else{
        try{
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const user = new User({
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword
            })
            await user.save();
            res.redirect("/")
        } catch(error){
            console.log(error);
            res.redirect('/register');
        }
    }
}) 


app.post('/register_group', checkAuthenticated, async(req,res) => {
    const groupFound = await Group.findOne({name : req.body.groupname});

    if(groupFound){
        console.log('Group found');
        req.flash('error', 'That group already exists');
    }else{
        try{
            const group = new Group({
                name: req.body.groupname,
                members: [req.body.userId]
            })
            console.log("here");
            await group.save();
            console.log("here2")
            res.redirect('/');
        } catch(error){
            console.log('Catch block');
            res.redirect('/chat');
        }
    }
})

app.delete('/logout',(req, res)=>{
    req.logOut();
    res.redirect('/');
})



//SOCKET IO 
io.on('connection', socket =>{

    
    Message.find({}).sort({createdAt: -1}).limit(10).then(messages => {
        messages.forEach(message=>{
            io.emit('load message', formatmessage(message.username, message.content, message.user));
        })
    })

    //Runs when client disconnects

    socket.on("disconnect", ()=>{
        io.emit("message",formatmessage(botname, "A user has left the chat"));
    });

    //Listening for chatmessage
    
    socket.on('chatmessage',(message)=>{
        let messageAttributes = {
            content: message.msg,
            username: message.username,
            user: message.userid
        }
        m = new Message(messageAttributes);
        m.save()
            .then(()=>{
                io.emit('message', formatmessage(message.username,message.msg, message.userid));
            })
            .catch(error => console.log(`error: ${error.message}`));
        
    })

});

mongoose.connect(
    'mongodb+srv://sandesh714:sandesh714@zapper.xvaxr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    {
        useNewUrlParser:true,
        useUnifiedTopology:true
    }
)
.then(()=>{
    server.listen(PORT,()=>{
        console.log("Listening on Port "+ PORT);
    })
})