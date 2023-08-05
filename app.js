const express = require('express');
const app = express()
const { createServer } = require('http');
const server = createServer(app)
const { Server } = require('socket.io');
const io = new Server(server)
const path = require('path');

app.use(express.static(path.join(__dirname , "public")))



let onlineUsers = {}
io.on("connection" , socket => {

    console.log("Socket connected");
    
    socket.on("disconnect" , () => {
        delete onlineUsers[socket.id] //deletes an object property by its key
        io.emit("online-users" , onlineUsers)
    })

    //Listens to "login" event sent by client
    socket.on("login" , data => {
        onlineUsers[socket.id] = data.username
        io.emit("online-users" , onlineUsers)
    })
    

    console.log(onlineUsers);
    
    socket.on("call-user" , data => {        
        
        //Server sends offer and senderId to specified client
        socket.to(data.receiverId).emit("call-made" , {
            offer : data.offer,
            senderId : socket.id,
            onlineUsers               
        })
    })
    

    

    //Listens to "making-answer" event sent by client
    socket.on("making-answer" , data => {
        socket.to(data.to).emit("answer-made" , {
            socket : socket.id,
            answer : data.answer
        })
    })

    socket.on("reject-call" , data => {
        socket.to(data.senderId).emit("call-rejected" , { socket : socket.id , onlineUsers })
    })

})

const PORT = process.env.PORT || 3000
server.listen(PORT)
