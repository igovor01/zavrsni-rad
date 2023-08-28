/*----------------ako nema imena ili room namea, odvedi natrag u lobby */
let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomNumber = urlParams.get('room')

if(!roomNumber){
    window.location = 'lobby.html'
}

let myDisplayName = sessionStorage.getItem('display_name')
let myPicSrc = sessionStorage.getItem('pic-src')
if(!myDisplayName || !myPicSrc){
    window.location = 'lobby.html'
}



let divMainContainer = document.getElementById("mainContent")
let myPlayerCard = document.getElementById("player1");
let otherPlayerCard = document.getElementById("player2");

let rtcPeerConnection, isCaller
let dataChannel;

let mySign



console.log("My display name:", myDisplayName)

console.log('hey')

const iceServers = {
    'iceServer':[
        {'urls':'stun:stun.services.mozilla.com'},
        {'urls':'stun:stun.l.google.com:19302'}
    ]
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
        divMainContainer.style = "display:flex"
    }
}

function addSelfToDOM(){
    myPlayerCard.querySelector('.user-name').textContent = myDisplayName;
    myPlayerCard.querySelector('img').src = myPicSrc;
}

function addWaitingForUserToDOM(){
    //document.get h1 di je OTHER's ime i stavit "Waiting"
    otherPlayerCard.querySelector('.user-name').textContent = "Waiting...";
    otherPlayerCard.querySelector('img').src = "images/waiting.png";

    //obojat pozadinu u sivo
    otherPlayerCard.classList.add("not-connected");
    //document.get di je user-sign i nek bude = ""
    otherPlayerCard.querySelector(".user-sign").textContent = "?"

}


socket.on('created', room => {
    //caller side - ovo se trigera kad se 1. korisnik prikljuci
    //sami smo jos u sobi

    isCaller = true

   
    checkWhichSign()
})

socket.on('joined', room => {
    //callED side - ovo se trigera kad se on kao 2. korisnik prikljuci
    //sa linijom "socket.emit('ready', roomNumber)" gradi se vec slika u kojoj nismo sami u sobi
    
    socket.emit('ready', roomNumber)//gradimo konekciju
    console.log("User has joined!");

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
            name: myDisplayName,
            src: myPicSrc
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
                console.log("Sending from caller");
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
                console.log("sending from called side");
                handlePeerLeaving();
            }
        }
        //stvori sliku za callED side, neka bude neaktivno
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
/*
socket.on('userLeft', ()=>{
    handlePeerLeaving();
})*/


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
        default:
            break;
    }
}

function addOtherToDom(data){
    otherName = data.name
    otherSrc = data.src
    otherPlayerCard.classList.remove("not-connected")

    otherPlayerCard.querySelector(".user-name").textContent = otherName
    otherPlayerCard.querySelector("img").src = otherSrc
}


function showPopUp(type){
    const popUp = document.querySelector(".popUp");
    const popUpImage = document.querySelector(".popUpImage");
    const popUpMessage = document.querySelector(".popUpMessage");
    const popUpButton = document.querySelector(".popUpButton")
    document.getElementById("mainContent").style.filter = "blur(3px)";

    popUp.style.transform = "translate(-50%, -50%) scale(1)";
    popUp.style.transitionDuration = "0.3s";

    switch(type){
        case "win":
            popUpImage.innerHTML = `<i class="fa-solid fa-trophy fa-bounce fa-xl" style="color: #ffd43b;"></i>`;
            popUpMessage.innerHTML = "Congrats, You Won!";
            popUpButton.textContent = "Rematch"
            popUpButton.addEventListener("click", restartGame);
            break;
        case "lose":
            popUpImage.innerHTML = `<i class="fa-regular fa-face-surprise fa-2xl" style="color: #000000;"></i>`;
            popUpMessage.innerHTML = currentPlayer +" Won!";
            popUpButton.textContent = "Rematch"
            popUpButton.addEventListener("click", restartGame);
            break;
        case "draw":
            popUpImage.innerHTML = `<i class="fa-solid fa-handshake fa-2xl" style="color: #000000;"></i>`;
            popUpMessage.textContent = "Draw!";
            popUpButton.textContent = "Rematch";
            popUpButton.addEventListener("click", restartGame);
            break;
        case "user-left":
            popUpImage.innerHTML = `<i class="fa-solid fa-heart-crack fa-2xl" style="color: #c20000;"></i>`;
            popUpMessage.textContent = "Opponent left!";
            popUpButton.textContent = "Go To Lobby";
            popUpButton.addEventListener("click", () => { window.location = 'lobby.html'});

            break;
    }
}

function handlePeerLeaving(){
    if (dataChannel.readyState === 'open') {
        dataChannel.close(); 
    }
    // Close RTCPeerConnection
    rtcPeerConnection.close();
    //neka peer izađe i iz socket room
    socket.emit('leave', roomNumber);
    //ugasit ploču
    cells.forEach(cell => cell.removeEventListener("click", handleCellClicked));
    showPopUp("user-left");
    //addWaitingForUserToDOM()     
    //restartBtn.disabled = true;
    console.log('Peer connection closed.');

}

window.addEventListener('beforeunload', handlePeerLeaving)
init()



