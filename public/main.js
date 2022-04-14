const chatform = document.getElementById('chat-form');
const chatmessages = document.querySelector('.chat-messages');
const socket = io();


let {username, room} = Qs.parse(window.location.search, {
    ignoreQueryPrefix: true
})





socket.emit('joinRoom', { username, room});




//Join chatroom



socket.on('message', message =>{
    console.log(message);
    outputmessage(message);


    // Scroll down
    chatmessages.scrollTop = chatmessages.scrollHeight;
});

socket.on('load group', (data) => {
    console.log(data);
    outputgroupinfo(data);
})

socket.on('load message', (data) => {
    outputmessage(data);
})

// When the message submits
chatform.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    const username = e.target.elements.username.value;
    const userid = e.target.elements.userid.value;
    message = {
        'msg': msg,
        'username': username,
        'userid': userid
    }
    socket.emit('chatmessage', message);
    //Clear input box
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
})


// Output function for sending outputting message to DOM
function outputmessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

function outputgroupinfo(message){
    const div = document.createElement('div');
    div.innerHTML = `<h2>${message.group_name}</h2>
                    <p>${message.group_description}</p>`
    document.querySelector('.chat-sidebar').appendChild(div);
}


//Output function for loading old messages
function output_old_messages(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.createdAt}</span></p>
    <p class="text">
        ${message.content}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}