//intializes io on user's browser
const socket = io("localhost:3000")

let isAlreadyCalling = false
let getCalled = false


const { RTCPeerConnection , RTCSessionDescription } = window

const peerConnection = new RTCPeerConnection()

let username = localStorage.getItem("username")

async function callUser(socketId){
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer))

    //Emits call-user event to server
    //Server sends the offer to the specified receiver 
    socket.emit("call-user" , { offer : offer , receiverId : socketId })
}

function unselectUser(){
    const selectedUsers = document.querySelectorAll(".active-user .active-user--selected")
    selectedUsers.forEach(selectedUser => {
        selectedUser.setAttribute("class" , "active-user")
    })
}

//Listens to "call-made" event sent by server
socket.on("call-made" , async data => {
    if(getCalled){
        for(let socketId in data.onlineUsers){
            if(socketId === data.senderId){
                let confirmBox = confirm(`کاربر ${data.onlineUsers[socketId]} قصد تماس با شما را دارد`)
                if(!confirmBox){ 

                    //Emits reject-call event to server
                    socket.emit("reject-call" , { senderId : data.senderId })
                    return ;
                }
            }
        }
        
    }
     
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
    
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer))

    //Emits "making-answer" event to server
    socket.emit("making-answer" , { answer : answer, to : data.senderId })

    getCalled = true

})

socket.on("answer-made" , async data => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
    if(!isAlreadyCalling){
        callUser(data.socket)
        isAlreadyCalling = true
    }
})

socket.on("call-rejected" , data => {
    for(let socketId in data.onlineUsers){
        if(socketId === data.socket){
            alert(`کاربر با نام  ${data.onlineUsers[socketId]} تماس شما را قبول نکرد`)
            unselectUser()
        }
    }
    

    
})

//Listens to "remove-user" event sent by the server
socket.on("remove-user" , data => {
    const user = document.getElementById(data.socketId)
    user.remove()
})


function createElements(socketId , username){
    const userContainer = document.createElement("div")
    const p = document.createElement("p")

    userContainer.setAttribute("class" , "active-user")
    userContainer.setAttribute("id" , socketId)
    p.setAttribute("class" , "username")
    p.innerHTML = `کاربر : ${username}`
    userContainer.appendChild(p)
    
    userContainer.addEventListener("click" , () => {
        const talking = document.getElementById("talking-with-info")
        unselectUser()
        userContainer.setAttribute("class" , "active-user active-user--selected")
        talking.innerHTML = `تماس با ${username} در حال برقراری است`
        callUser(socketId)
    })
    return userContainer
}

function onlineUsersList(onlineUsers){
    const activeUsersContainer = document.getElementById("active-users-container")
    
    //Access the value by its key
    for(let socketId in onlineUsers){
        const userExist = document.getElementById(socketId)
        if(!userExist) activeUsersContainer.appendChild(createElements(socketId , onlineUsers[socketId]))
    }
}


socket.emit("login" , { username : username })

socket.on("online-users" , onlineUsers => {
    onlineUsersList(onlineUsers)
})

peerConnection.ontrack = function(data){
    console.log(data.streams[0]);
    const remoteVideo = document.getElementById("remote-video")
    if(remoteVideo) remoteVideo.srcObject = data.streams[0]
    
}

navigator.mediaDevices.getUserMedia({ video : true , audio : true })
.then(stream => {
    const localVideo = document.getElementById("local-video")
    if(localVideo) localVideo.srcObject = stream

    //MediaStreams.getTracks()
    //Puts all of the tracks into an array
    stream.getTracks().forEach(track => peerConnection.addTrack(track , stream))
})
.catch(err => console.log(err))

//For older browsers
/*
navigator.mediaDevices.getUserMedia({ video : true , audio : true }).then(stream => {
    const localVideo = document.getElementById("local-video")
    if(localVideo) localVideo.srcObject = stream
    
    //MediaStreams.getTracks()
    //Puts all of the tracks into an array
    stream.getTracks().forEach(track => peerConnection.addTrack(track , stream)}
    
.catch(err => {
    console.log(err.message)
})
*/
