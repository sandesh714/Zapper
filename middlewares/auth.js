function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/chat');
    }
    next();
}

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}

module.exports = {
    checkNotAuthenticated,
    checkAuthenticated
};