const moment = require('moment');

function formatmessage(username, text, userid, groupid) {
    return {
        username, 
        text,
        userid,
        groupid,
        time:moment().format('h:mm a')
    };
}

function formatgroup(group_description, group_name){
    return {
        group_description,
        group_name
    }
}

module.exports = {
    formatmessage,
    formatgroup 
}