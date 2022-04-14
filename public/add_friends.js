const send = document.getElementById('send');

const socket = io();




send.addEventListener('submit', (e) => {
    e.preventDefault();
    const reqBy = e.target.elements.reqBy.value;
    const reqTo = e.target.elements.reqTo.value;
    friend_request = {
        'reqBy': reqBy,
        'reqTo': reqTo
    } 
    socket.emit('friend_request', friend_request);
     // Change Add Friend to friend request sent
    
    
})