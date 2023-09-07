const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");

const winConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let options = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let running = false;

function initializeGame() {
  running = true;
  //restartGame();

  cells.forEach((cell) => cell.addEventListener("click", handleCellClicked));
  restartBtn.addEventListener("click", restartGame);
  statusText.textContent = currentPlayer == mySign ? `Your turn!` : `${currentPlayer}'s turn`;
}

function handleCellClicked() {
  const cellIndex = this.getAttribute("cellIndex");
  if (options[cellIndex] != "" || !running) {
    return;
  }

  updateCell(this, cellIndex);
  checkWinner();
  cells.forEach((cell) => cell.removeEventListener("click", handleCellClicked));
  this.style.backgroundColor = "#fff";

  const message = {
    type: "game-update",
    newElement: cellIndex,
    player: this.innerHTML,
  };
  dataChannel.send(JSON.stringify(message));
}

function updateCell(cell, index) {
  options[index] = currentPlayer;
  cell.textContent = currentPlayer;
}

function changePlayer() {
  currentPlayer = currentPlayer == "X" ? "O" : "X";
  if (currentPlayer == mySign) {
    statusText.textContent = `Your turn!`;
  }
  else {
    statusText.textContent = `${currentPlayer}'s turn`;
  }
  addTurnStyle();
}

function addTurnStyle() {
  if (currentPlayer == mySign) {
    myPlayerCard.classList.remove("player-not-turn");
    myPlayerCard.classList.add("player-turn");
    otherPlayerCard.classList.remove("player-turn");
    otherPlayerCard.classList.add("player-not-turn");

  }
  else {
    myPlayerCard.classList.remove("player-turn");
    myPlayerCard.classList.add("player-not-turn");
    otherPlayerCard.classList.remove("player-not-turn");
    otherPlayerCard.classList.add("player-turn");
  }

}
function checkWinner() {
  let roundWon = false;

  for (let i = 0; i < winConditions.length; i++) {
    const condition = winConditions[i];
    const cellA = options[condition[0]];
    const cellB = options[condition[1]];
    const cellC = options[condition[2]];

    if (cellA == "" || cellB == "" || cellC == "") {
      continue;
    }
    if (cellA == cellB && cellB == cellC) {
      roundWon = true;
      break;
    }
  }
  if (roundWon) {
    statusText.textContent = `${currentPlayer} wins!`;
    if (currentPlayer == mySign) {
      score = parseInt(document.querySelector("#player1 .score-counter h3").textContent);
      score++;
      document.querySelector("#player1 .score-counter h3").textContent = score;

      showPopUp("win");
    }
    else {
      score = parseInt(document.querySelector("#player2 .score-counter h3").textContent);
      score++;
      document.querySelector("#player2 .score-counter h3").textContent = score;

      showPopUp("lose");
    }
    running = false;
  } else if (!options.includes("")) {
    statusText.textContent = `Draw!`;
    showPopUp("draw");
  } else {
    changePlayer();
  }
}

function cleanBoard() {
  options = ["", "", "", "", "", "", "", "", ""];
  statusText.textContent = `${currentPlayer}'s turn`;
  addTurnStyle();

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.style.backgroundColor = "var(--very-light-gray-green)";
    cell.removeEventListener("click", handleCellClicked);
  });
  running = true;
}

function restartGame() {
  currentPlayer = mySign == "X" ? "O" : "X";
  cleanBoard();
  const message = {
    type: "game-restart",
    currentPlayer: currentPlayer,
  };
  dataChannel.send(JSON.stringify(message));
}

//initializeGame();
