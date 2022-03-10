const chatform = document.getElementById('chat-form');
const chatmessages = document.querySelector('.chat-messages');
const socket = io();

socket.on('message', message =>{
    console.log(message);
    outputmessage(message);


    // Scroll down
    chatmessages.scrollTop = chatmessages.scrollHeight;
});

// When the message submits
chatform.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    socket.emit('chatmessage',msg);

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