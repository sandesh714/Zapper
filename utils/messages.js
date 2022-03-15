const moment = require('moment');

function formatmessage(username, text, userid) {
    return {
        username, 
        text,
        userid,
        time:moment().format('h:mm a')
    };
}
module.exports = formatmessage;