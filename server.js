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
const bcrypt = require('bcryptjs');
const {
    checkAuthenticated,
    checkNotAuthenticated
} = require('./middlewares/auth');
const {formatmessage, formatgroup} = require('./utils/messages');

const botname = "Zapper Bot";
const app = express();
const server = http.createServer(app);
const io = socket(server);

const {userJoin, getCurrentUser}  = require('./utils/users');

const initializePassport = require('./passport-config');
const { emit } = require('process');
const { join } = require('path');
const e = require('express');
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



app.get('/index', checkAuthenticated, async(req, res) => {
    let userlist = [];
    let grouplist = [];
    let current_user = await User.findOne({username: req.user.username});
    let friend_list = await current_user.friend_list;
    console.log(friend_list)
    let private_grouplists = [];
    if (!friend_list){
        private_grouplists = [];
    }else{
        private_grouplists = [...friend_list];
    }
    console.log(typeof friend_list)
    let public_grouplists = await Group.find({type:'public'}).sort().then(groups => {
        groups.forEach(group => {
            grouplist.push(group.name);
        })
        return grouplist;
    })
    console.log(private_grouplists)
    res.render('index', { data: { user : req.user, users: private_grouplists, groups: public_grouplists}});
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



app.get('/add_friends', checkAuthenticated, async(req, res) => {
    let non_friends = [];
    
    let exclude_list = [];
    //Don't include the user
    const user_af = req.user.username;
    exclude_list.push(user_af);
    //Dont include people in user's friend list
    let user_det = await User.find({username: user_af});
    let friends_list = user_det[0].friend_list;
    if (friends_list) {
        friends_list.forEach(friend => {
            exclude_list.push(friend);
        })
    }

    // console.log(exclude_list);
    // console.log("\n");
    //Dont include people has sent requests to i.e pending_requests
    let pending_req_af = user_det[0].pending_requests;
    console.log(pending_req_af);
    pending_req_af.forEach(pending => {
        exclude_list.push(pending);
    })
    let rec_req_af = user_det[0].friend_requests;
    rec_req_af.forEach(received => {
        exclude_list.push(received);
    })
    // console.log(exclude_list);
    // console.log("\n");

    let add_friend_list = await User.find({}).sort().then(users=>{
        users.forEach(user => {
            let pot_friend = user.username;
            if (!(exclude_list.includes(pot_friend))){
                non_friends.push(pot_friend);
            }
            
        })
        return non_friends;
    })
    const username = req.user;
    res.render('add_friends', {
       data: {add_friend : add_friend_list, user: username} 
    });
})



app.get('/friend_requests', checkAuthenticated, async(req, res) => {
    let friend_request = [];
    // let friend_request_list = await User.find({username: req.user.username}).sort().then(users=>{
    //     users.forEach(user => {
    //         frns = user.friend_requests;
    //         frns.forEach(frn => {
    //             friend_request.push(frn);
    //         })
    //         console.log(friend_request)
    //         return friend_request;
    //     })
    // })

    let userObj = await User.find({"username": req.user.username});
    let friend_request_list = userObj[0].friend_requests;
    friend_request_list = [...new Set(friend_request_list)];
    console.log(friend_request_list);
    res.render('friend_requests', {
        data: {friend_requests: friend_request_list}
    });


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
app.post('/add_friends', checkAuthenticated, async(req, res) => {
    var reqBy = req.user.username;
    var reqTo = req.body.reqTo;
    console.log(reqBy);
    console.log(reqTo);
    await User.findOneAndUpdate(
        {username: reqTo},
        { $push: {friend_requests: reqBy}}
    )
    await User.findOneAndUpdate(
        {username: reqBy}, 
        { $push: {pending_requests: reqTo}}
    ).then(()=> {
        console.log("finished");
    })
    res.redirect('/add_friends');


})

app.post('/friend_requests', checkAuthenticated, async(req, res) => {
    var reqBy = req.user.username;
    var reqTo = req.body.reqTo;

    var group_name = reqBy + reqTo;
    var members = [];
    members.push(reqBy);
    members.push(reqTo);
    console.log(typeof members);
    console.log(members)
    //Removing user1 from user2's friend_requests
    await User.findOneAndUpdate(
        {username: reqBy},
        { $pull: {friend_requests: reqTo}}
    ).then(()=>{
        console.log("Removed user2 from user1's friend requests");
    })
    //Removing user2 from user1's pending_requests
    await User.findOneAndUpdate(
        {username: reqTo}, 
        { $pull: {pending_requests: reqBy}}
    ).then(()=>{
        console.log("Removed user1 from user2's pending_requests");
    })

    //Adding user1 to user2's friend_list
    //Adding user2 to use1's friend list
    await User.findOneAndUpdate(
        {username: reqBy}, 
        { $push: {friend_list: [reqTo, group_name]}}
    ).then(()=>{
        console.log("Added user2 to user1's friend_list");
    })

    await User.findOneAndUpdate(
        {username: reqTo}, 
        { $push: {friend_list: [reqBy,group_name]}}
    ).then(()=>{
        console.log("Added user1 to user2's friend_list");
    })
    const group = new Group({
        name: group_name,
        members: members,
        type: 'private'
    })
    await group.save();
    
    res.redirect('/friend_requests');


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
            await Group.updateMany(
                {type: 'public'}, 
                { $push: {members: req.body.username}}
            )
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
                members: [req.user.username],
                description: req.body.description,
                type:'public'
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
    socket.on('joinRoom', async ({username, room}) =>{
        console.log("HERE");
        const user = userJoin(socket.id, username, room);
        let groupid;
        let group_desc; 
        await Group.find({name: room}).then(groups =>{
                groups.forEach(group => {
                    groupid = group._id;
                })
        });
        socket.join(user.room)
        Group.find({name: room}).then(groups => {
            groups.forEach(group => {
                if (group.description == undefined){
                    group_users = group.members;
                    group_users.forEach(users => {
                        if(users != username){
                            console.log("Here2");
                            socket.emit('load group', formatgroup('', users))
                        }
                    })
                }else{
                    socket.emit('load group', formatgroup(group.description, room))            
                }

            })
        })
        Message.find({group: groupid}).sort({createdAt: 1}).limit(10).then(messages => {
            messages.forEach(message=>{
                socket.emit('load message', formatmessage(message.username, message.content, message.user, message.groupid));
            })
        })

        //Listening for chatmessage
        
        socket.on('chatmessage',(message)=>{
            const user1 = getCurrentUser(socket.id);
            let messageAttributes = {
                content: message.msg,
                username: message.username,
                user: message.userid,
                group: groupid
            }
            m = new Message(messageAttributes);
            m.save()
                .then(()=>{
                    io.to(user.room).emit('message', formatmessage(message.username,message.msg, message.userid, message.group));
                })
                .catch(error => console.log(`error: ${error.message}`));
        })
    });

});

mongoose.connect(
    process.env.MONGO_SRI,
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