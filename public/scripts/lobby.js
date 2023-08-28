let form = document.getElementById('join-form')
let circles = document.querySelectorAll(".circle-link")

let isCircleClicked = false;
let currentlyClickedCircle;

circles.forEach((circle) => circle.addEventListener("click", handleCircleClicked))

function handleCircleClicked(event) {
    newClickedCircle = event.target
    if(newClickedCircle.closest(".form-field-wrapper").querySelector("span").innerHTML != "")
        {removeErrorMessage("icon")}
    if(isCircleClicked == true){
        if(newClickedCircle.classList.contains('clicked')){
            //ako opet kliknemo na kliknutog
            newClickedCircle.classList.remove('clicked')
            isCircleClicked = false;
        }
        else{
            //ako je kliknut jedan, a mi kliknemo na neki drugi
            currentlyClickedCircle.classList.remove('clicked')
            isCircleClicked = true;
            currentlyClickedCircle = newClickedCircle;
            currentlyClickedCircle.classList.add('clicked');
        }
    }
    else{
        //ako nista dosad nije kliknuto, a mi kliknemo na nesto
        currentlyClickedCircle = newClickedCircle;
        currentlyClickedCircle.classList.add('clicked');
        isCircleClicked =true;
    }
    
 }

let allInputs = document.querySelectorAll("input")
for(let i=0; i<allInputs.length; i++){
    let input = allInputs[i]
    input.addEventListener("input", () => {
        let nameOfInput= input.getAttribute("name")
        console.log(nameOfInput);
        if(input.classList.contains("input-error")){
            removeErrorMessage(nameOfInput);
        }
    });
}


function addErrorMessage(inputField, message){
    let containerClass;
    switch(inputField){
        case "icon":
            containerClass = ".circle-container";   
            break;
        case "name":
            containerClass = 'input[name="name"]';
            document.querySelector(containerClass).classList.add("input-error")
            break;
        case "room":
            containerClass = 'input[name="room"]';
            document.querySelector(containerClass).classList.add("input-error")
            break;
        default:
            break;
    }
    let errorMessageSpan = document.querySelector(containerClass).closest(".form-field-wrapper").querySelector("span");
    errorMessageSpan.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color: #b80707;"></i> ` +message;        
}

function removeErrorMessage(inputField){
    let containerClass;
    switch(inputField){
        case "icon":
            console.log("treba maknit error sa ikona");
            containerClass = ".circle-container";   
            break;
        case "name":
            console.log("treba maknit error sa imena");
            containerClass = 'input[name="name"]';
            document.querySelector(containerClass).classList.remove("input-error")
            break;
        case "room":
            console.log("treba maknit error sa sobe");
            containerClass = 'input[name="room"]';
            document.querySelector(containerClass).classList.remove("input-error")
            break;
        default:
            break;
    }
    let errorMessageSpan = document.querySelector(containerClass).closest(".form-field-wrapper").querySelector("span");
    errorMessageSpan.innerHTML = "";        

}



let displayName = sessionStorage.getItem('display_name')
if(displayName){
    form.name.value = displayName
}

let displayPicSrc = sessionStorage.getItem('pic-src')
if(displayPicSrc){
    for(let i=0; i<circles.length; i++){
        let circle = circles[i];
        let imgElement = circle.querySelector("img");
        if(imgElement.getAttribute("src") === displayPicSrc){
            currentlyClickedCircle = circle;
            currentlyClickedCircle.classList.add('clicked');
            isCircleClicked = true;
            break;
        }
    }
}
form.addEventListener('submit', (e) =>{
    e.preventDefault()

    let nameInput = form.querySelector('input[name="name"]');
    let roomInput = form.querySelector('input[name="room"]')
    console.log(nameInput.value);
    console.log(roomInput.value);

    if(!isCircleClicked){
        addErrorMessage("icon", "Please select your icon.")
        return;
    }
    if(!nameInput.value){
        addErrorMessage("name", "Please enter your name.")
        return;
    }
    if(!roomInput.value){
        addErrorMessage("room", "Please enter room name.")
        return;
    }
    
    sessionStorage.setItem('display_name', e.target.name.value)
    sessionStorage.setItem('pic-src', currentlyClickedCircle.querySelector("img").getAttribute("src") )
    
    let inviteCode = e.target.room.value
    if(!inviteCode){
        inviteCode = String(Math.floor(Math.random() * 10000))
    }
    window.location = `index.html?room=${inviteCode}`
})


document.querySelector(".fa-xmark").addEventListener("mouseover", (e) =>{
    e.target.classList.add("fa-spin")
})

document.querySelector(".fa-xmark").addEventListener("mouseout", (e) =>{
    e.target.classList.remove("fa-spin")
})

document.querySelector(".fa-o").addEventListener("mouseover", (e) => {
    e.target.classList.add("fa-bounce")
})

document.querySelector(".fa-o").addEventListener("mouseout", (e) => {
    e.target.classList.remove("fa-bounce")
})