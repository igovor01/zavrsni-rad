//let divSelectRoom = document.getElementById('selectRoom')
let divConsultingRoom = document.getElementById('consultingRoom')
//let inputRoomNumber = document.getElementById('roomNumber')
//let btnGoRoom = document.getElementById('goRoom')
let localVideo = document.getElementById('localVideo')
let remoteVideo = document.getElementById('remoteVideo')

let h2CallName = document.getElementById("callName")
let inputCallName = document.getElementById("inputCallName")
let btnSetName = document.getElementById("setName")

let divGameContainer = document.getElementById("gameContainer")
let myPlayerCard = document.getElementById("player1");
let otherPlayerCard = document.getElementById("player2");

let localStream, remoteStream, rtcPeerConnection, isCaller
let dataChannel;

let mySign


/*----------------ako nema imena ili room namea, odvedi natrag u lobby */
let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomNumber = urlParams.get('room')

if(!roomNumber){
    window.location = 'lobby.html'
}

let myDisplayName = sessionStorage.getItem('display_name')
if(!myDisplayName){
    window.location = 'lobby.html'
}
console.log("My display name:", myDisplayName)

console.log('hey')

const iceServers = {
    'iceServer':[
        {'urls':'stun:stun.services.mozilla.com'},
        {'urls':'stun:stun.l.google.com:19302'}
    ]
}

const streamConstraints = {
    audio: true,
    video:true
}

const socket = io()

init = () => {
    if(roomNumber === ''){
        alert("please type a room name")
    } else{
        addSelfToDOM()
        addWaitingForUserToDOM()
        
        initializeGame()
        cells.forEach(cell => cell.removeEventListener("click", handleCellClicked));
        //restartBtn.disabled = true;
        socket.emit('create or join', roomNumber)
        // ------događa se obojici igrača------
        //0. neka se div s pločom i igračima pojavi
        //1. inicijalizirat igru kao NEAKTIVNU - aktivna tek kad u 'created'
        //checkWhichSign()
        //divSelectRoom.style = "display:none"
        divConsultingRoom.style = "display:block"
        divGameContainer.style = "display:flex"
    }
}

function addSelfToDOM(){
    //document.get h1 di je ime i stavit svoje ime
    myPlayerCard.querySelector('.user-name').textContent = myDisplayName;
    //document.get di je slika potencijalno i stavit svoju sliku
}

function addWaitingForUserToDOM(){
    //document.get h1 di je OTHER's ime i stavit "Waiting"
    otherPlayerCard.querySelector('.user-name').textContent = "Waiting for player...";
    //document.get di je slika i stavit Waiting sliku
    //obojat pozadinu u sivo
    otherPlayerCard.classList.add("not-connected");
    //document.get di je user-sign i nek bude = ""
    otherPlayerCard.querySelector(".user-sign").textContent = "?"

}

btnSetName.onclick = () => {
    if(inputCallName.value === ''){
        alert("please type a call name")
    } else{
        const message = {
            type: 'update-call-name',
            callName: inputCallName.value
            } 
        dataChannel.send(JSON.stringify(message))
        h2CallName.innerText = inputCallName.value
    }
}

socket.on('created', room => {
    //caller side - ovo se trigera kad se 1. korisnik prikljuci
    //sami smo jos u sobi

    isCaller = true

    navigator.mediaDevices.getUserMedia(streamConstraints)
         .then(stream => {
            localStream = stream
            localVideo.srcObject = localStream
            isCaller = true
        })
        .catch(err => {
            console.log('An error occured', err)
        })

    
    checkWhichSign()
})

socket.on('joined', room => {
    //callED side - ovo se trigera kad se on kao 2. korisnik prikljuci
    //sa linijom "socket.emit('ready', roomNumber)" gradi se vec slika u kojoj nismo sami u sobi
    
    navigator.mediaDevices.getUserMedia(streamConstraints)
         .then(stream => {
            localStream = stream
            localVideo.srcObject = localStream
            socket.emit('ready', roomNumber)//gradimo konekciju
            console.log("User has joined!");
        })
        .catch(err => {
            console.log("An error occured", err)
        })
    checkWhichSign()
})

socket.on('full', room => {
    //kad je soba puna
    window.location = 'lobby.html'
    //ispisi poruku Room "naziv sobe" is full. Try another.
})


function sendUserInfo(){
    //let userName = document.getElementById('input u kojem cemo inputat svoje ime')
    //let picUrl = url slike koja ce nam bit profilna/eventualno imat par slika ponudenih
    const message = {
            type: 'user-info',
            name: myDisplayName
    }
    dataChannel.send(JSON.stringify(message))
}

socket.on('ready', () => {
    //caller side - ovo se trigera kad se sugovornik prikljuci
    if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.oniceconnectionstatechange = ()=> {
            console.log('ICE Connection State:', rtcPeerConnection.iceConnectionState);
            
            if (rtcPeerConnection.iceConnectionState === 'disconnected' || rtcPeerConnection.iceConnectionState === 'closed') {
                console.log('Peer has left the connection.');
                handlePeerLeaving();
            }
        }
        /*rtcPeerConnection.oniceconnectionstatechange = () => {
            console.log("Connection state: -------", rtcPeerConnection.connectionState)
        
            if (rtcPeerConnection.connectionState == 'connected'){
                console.log("---------------------uslo ovdje-----------------------------------")
                initializeGame()
            }
        }*/
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream)
        //tu bi tribali inicalirat igru kao da mi prvi igramo
        
        dataChannel = rtcPeerConnection.createDataChannel(roomNumber)
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                console.log('sending offer', sessionDescription)
            rtcPeerConnection.setLocalDescription(sessionDescription)
            socket.emit('offer', {
                type: 'offer',
                sdp: sessionDescription,
                room: roomNumber,
            })
        })
            .catch(err =>{
            console.log(err)
        })
        //iniijalizirajmo da je ploca aktivna
        dataChannel.onmessage = handleChannelMessage
        dataChannel.onopen = () =>{
        if(otherPlayerCard.classList.contains("not-connected")){
            sendUserInfo()
        }
        initializeGame()
        }
        
        //dataChannel.onclose = handleChannelClose
    }
})

function checkWhichSign(){
    mySign = isCaller ? "X" : "O"
    console.log("My (", myDisplayName, ") sign is, ", mySign)
    myPlayerCard.querySelector(".user-sign").textContent =  mySign == "X" ? "X" : "O"
    otherPlayerCard.querySelector(".user-sign").textContent = mySign =="X" ? "O" : "X"
}

socket.on('offer', (event)=>{
    //callED side
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.oniceconnectionstatechange = ()=> {
            console.log('ICE Connection State:', rtcPeerConnection.iceConnectionState);
            
            if (rtcPeerConnection.iceConnectionState === 'disconnected' || rtcPeerConnection.iceConnectionState === 'closed') {
                console.log('Peer has left the connection.');
                handlePeerLeaving();
            }
        }
        //stvori sliku za callED side, neka bude neaktivno
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream)
        console.log('received offer', event)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        rtcPeerConnection.ondatachannel = event => {
            dataChannel = event.channel
            dataChannel.onmessage = handleChannelMessage
            dataChannel.onopen = () =>{
            if(otherPlayerCard.classList.contains("not-connected")){
                    sendUserInfo()
            }}
            //dataChannel.onclose = handleChannelClose
        }
        rtcPeerConnection.createAnswer()
        .then(sessionDescription => {
            console.log('sending answer', sessionDescription)
            rtcPeerConnection.setLocalDescription(sessionDescription)
            socket.emit('answer', {
                type: 'answer',
                sdp: sessionDescription,
                room: roomNumber,
            })
        })
        .catch(err =>{
            console.log(err);
        })
    } 
})

socket.on('answer', event => {
    //caller side
    console.log('received answer', event)
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('candidate', event=>{
    const candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate.candidate,
        sdpMid: event.id,
    })
    console.log('received candidate', candidate)
    rtcPeerConnection.addIceCandidate(candidate)
})

function onAddStream(event){
    remoteVideo.srcObject = event.streams[0]
    remoteStream = event.streams[0] 
}

function onIceCandidate(event){
    if(event.candidate){
        console.log('sending ice candidate', event.candidate)
        socket.emit('candidate', {
            type: 'candidate', 
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate,
            room: roomNumber
        })
    }else{
        console.log('not sending ice')
    }
}

function handleChannelMessage(message){
    console.log("New message, ", message.data)
    let data = JSON.parse(message.data)

    switch(data.type){
        case "user-info":
            addOtherToDom(data)
            break;
        case "game-update":
            console.log('A new message was received')
            console.log("Message:", data)
            let cellNumber = data.newElement;
            let cellToUpdate =  cells[cellNumber]
            currentPlayer = data.player;
            updateCell(cellToUpdate, cellNumber);
            
            checkWinner();

            cells.forEach(cell => cell.addEventListener("click", handleCellClicked));
            break;
        case "game-restart":
            console.log('A new message was received')
            console.log("Message:", data)
            restartGame();
            currentPlayer = data.currentPlayer
            initializeGame()
            break;
        case "update-call-name":
            document.getElementById("callName").innerHTML = data.callName
            break;
        default:
            break;
    }
}

function addOtherToDom(data){
    otherName = data.name
    //otherPicUrl = data.pic-url
    otherPlayerCard.classList.remove("not-connected")

    otherPlayerCard.querySelector(".user-name").textContent = otherName
    //document.get di je OTHER slika  i stavit za src OTHER sliku
}

function handlePeerLeaving(){
    if (dataChannel.readyState === 'open') {
        dataChannel.close();
    }
    // Close RTCPeerConnection
    rtcPeerConnection.close();
    //ugasit ploču
    cells.forEach(cell => cell.removeEventListener("click", handleCellClicked));
    addWaitingForUserToDOM()     
    //restartBtn.disabled = true;
    console.log('Peer connection closed.');

}

window.addEventListener('beforeunload', handlePeerLeaving)
init()



