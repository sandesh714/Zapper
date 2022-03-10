const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByUsername, getUserById){
    const authenticateUser = async(username, password, done)=>{
        const user = await getUserByUsername(username);
        if(user == null){
            return done(null, false,{message: "No user with that username"});
        }
        try{
            if(await bcrypt.compare(password,user.password)){
                return done(null, user);
            }
            else{
                return done(null, false, {message:'Password Incorrect'})
            }
        } catch(err){
            return done(e);
        }
    };
    passport.use(new LocalStrategy({usernameField: 'username'}, authenticateUser))
    passport.serializeUser((user, done)=>done(null, user.id));
    passport.deserializeUser(async(id, done)=>{
        return done(null, await getUserById(id));
    })
}

module.exports = initialize;