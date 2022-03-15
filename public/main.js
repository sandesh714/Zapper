const chatform = document.getElementById('chat-form');
const chatmessages = document.querySelector('.chat-messages');
const socket = io();





socket.on('message', message =>{
    console.log(message);
    outputmessage(message);


    // Scroll down
    chatmessages.scrollTop = chatmessages.scrollHeight;
});

socket.on('load messages', (data) => {
    console.log(data);
    data.forEach(message => {

        outputmessage(message);
        
    })
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