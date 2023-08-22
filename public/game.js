const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");


const winConditions = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
];

let options = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let running = false;


//document.getElementById('player1').querySelector('h1').innerHTML = currentPlayer;
//document.getElementById('player2').style.backgroundColor = "#454545";


function initializeGame(){
    console.log("IGRA SE INICIJALIZIRA")
    running= true;
    
   // restartBtn.disabled = false
    cells.forEach(cell => cell.addEventListener("click", handleCellClicked));
    restartBtn.addEventListener("click", () => {
        restartGame();
        
        const message = {
            type: 'game-restart',
            currentPlayer: currentPlayer
        }
        dataChannel.send(JSON.stringify(message))
    });
    statusText.textContent = `${currentPlayer}'s turn`;
}

function handleCellClicked(){
    const cellIndex = this.getAttribute("cellIndex");
    
    if(options[cellIndex] != "" || !running){
        return;
    }

    updateCell(this, cellIndex);
    checkWinner();
    cells.forEach(cell => cell.removeEventListener("click", handleCellClicked));

    this.style.backgroundColor = "#858525"

    const message = {
        type: 'game-update',
        newElement: cellIndex,
        player: this.innerHTML//taj player koji je trenutno tu, this.innerHTML 
    }
    dataChannel.send(JSON.stringify(message))

   
    //cells.forEach(cell => cell.removeEventListener("click", handleCellClicked));
}

function updateCell(cell, index){
    options[index] = currentPlayer;
    cell.textContent = currentPlayer;
}

function changePlayer(){
    currentPlayer = (currentPlayer == "X" ) ? "O" : "X";
    statusText.textContent = `${currentPlayer}'s turn`;

}

function checkWinner(){
    let roundWon = false;

    for(let i=0; i<winConditions.length; i++)
    {
        const condition = winConditions[i];
        const cellA = options[condition[0]];
        const cellB = options[condition[1]];
        const cellC = options[condition[2]];

        if(cellA =="" || cellB=="" || cellC==""){
            continue;
        }
        if(cellA == cellB && cellB==cellC){
            roundWon = true;
            break;
        }
    }
    if(roundWon){
        statusText.textContent = `${currentPlayer} wins!`;
        running = false;
    }
    else if(!options.includes("")){
        statusText.textContent = `Draw!`;
    }
    else{
        changePlayer();
    }
}

function restartGame(){
    currentPlayer = mySign =="X" ? "O" : "X";
    options = ["", "", "", "", "", "", "", "", ""];
    statusText.textContent = `${currentPlayer}'s turn`;

    cells.forEach(cell => {
        cell.textContent = "";
        cell.style.backgroundColor = "transparent";
        cell.removeEventListener("click", handleCellClicked)
    });
    running = true;
}

//initializeGame();