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



const initializePassport = require('./passport-config');
const { emit } = require('process');
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
    res.render('register')
})

app.get('/chat',checkAuthenticated,(req, res)=>{
    res.render('chat', {user : req.user});
})

app.post('/', checkNotAuthenticated, passport.authenticate('local',{
    successRedirect: '/chat',
    failureRedirect: '/',
    failureFlash: true,
}))

app.post('/register', checkNotAuthenticated, async(req, res)=>{
    const userFound = await User.findOne({email: req.body.email});

    if(userFound){
        req.flash('error', 'User with that email already exists');
        res.redirect('/register');
    }else{
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

app.delete('/logout',(req, res)=>{
    req.logOut();
    res.redirect('/');
})



//SOCKET IO 
io.on('connection', socket =>{
    
    Message.find({}).sort({createdAt: -1}).limit(10).then(messages => {
        // io.emit('load messages', messages.reverse());
        console.log(messages);
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
