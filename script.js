const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 100;
const DANCE_ANIMATION_DURATION = 500;

//Elements from the HTML layout
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]"); //Get the div with that data set as a query
const keyboard = document.querySelector("[data-keyboard]")

//Word picker
const offsetFromDate = new Date(2022, 0, 2);      //Start date
const msOffset = Date.now() - offsetFromDate;     //Today
const dayOffset = msOffset / 1000 / 60 / 60 / 24; //Ellapsed time
const targetWord = targetWords[Math.floor(dayOffset)];


startInteraction();

//A function to have the option to stop the event listeners
function startInteraction(){
    document.addEventListener("click", handleMouseClick);
    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("keyup", handleKeyUp);
}

function stopInteraction(){
    document.removeEventListener("click", handleMouseClick);
    document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(e){
    if(e.target.matches("[data-key]")){
        pressKey(e.target.dataset.key);
        return;
    }

    if (e.target.matches("[data-enter]")){
        submitGuess();
        return;
    }

    if(e.target.matches("[data-delete")){
        deleteKey();
        return;
    }
}

function handleKeyPress(e){
    hoverKey(e.key);
    if(e.key === "Enter"){
        submitGuess()
        return;
    }

    if(e.key === "Backspace" || e.key === "Delete"){
        deleteKey();
        return;
    }

    if(e.key.match(/^[a-z]$/) || e.key.match(/^[A-Z]$/)){
        //"/[a-z]/":any character between 'a' and 'z'
        //^:start $:end so its only one character long ("[]")
        pressKey(e.key);
        return;
    }
}

function handleKeyUp(e){
  let keyboardKey = keyboard.querySelector(`[data-key="${e.key}"i]`);
  if(!keyboardKey){
    if(e.key == "Backspace"){
      keyboardKey = keyboard.querySelector("[data-delete]");
    }else if(e.key == "Enter"){
      keyboardKey = keyboard.querySelector("[data-enter]");
    }else{return;}
  }
  keyboardKey.classList.remove("hover")
}

function pressKey(key){
    //Get a array of all the div's with "active" dateset
    // (remember that active means that it is a tile that was typed on)
    const activeTiles = getActiveTiles();
    if(activeTiles.length >= WORD_LENGTH){
      return;
    }
    const nextTile = guessGrid.querySelector(":not([data-letter])");
    //^-Query selector looks for the first match attribute.
    // Therefore, we look for the first that does not has a "visited" attribute ("[data-letter]")
    // and we added that new attribute to the just visited letter.

    //Sets the letter to the div as an dataset to look for it on the dictionary later on
    nextTile.dataset.letter = key.toLowerCase();
    //Puts said letter in the tile
    nextTile.textContent = key;
    nextTile.dataset.state = "active"
}

function hoverKey(key){
  let keyboardKey = keyboard.querySelector(`[data-key="${key}"i]`);
  if(!keyboardKey){
    keyboardKey = keyboard.querySelector(".key.large");
    if(key == "Backspace"){
      keyboardKey = keyboard.querySelector("[data-delete]");
    }else if(key == "Enter"){
      keyboardKey = keyboard.querySelector("[data-enter]");
    }else{return;}
  }
  keyboardKey.classList.add("hover");
}

function deleteKey(){
    //Get a array of all the div's with "active" dateset
    const activeTiles = getActiveTiles();
    //Get the last added to the array
    const lastTile = activeTiles[activeTiles.length - 1]
    if(lastTile == null){
      return;
    }

    //Deletion process of a filled/typed letter:
    lastTile.textContent = " ";
    delete lastTile.dataset.state;
    delete lastTile.dataset.letter;
}

function submitGuess(){
  const maxAlerts = 7;
  const activeTiles = [...getActiveTiles()];
  if (activeTiles.length != WORD_LENGTH){
    if(alertContainer.childElementCount < maxAlerts){
      showAlert("Not enough letters (" + activeTiles.length + "/5)");
    }
    shakeTiles(activeTiles);
    return;
  }

  //Convert the active tiles into a full word in order to get the user's guess
  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter;
  }, "")
  //con-sole.log(guess);
  
  if(!dictionary.includes(guess) && alertContainer.childElementCount < maxAlerts){
    showAlert("Not a word!");
    shakeTiles(activeTiles);
    return;
  }

  stopInteraction();
  activeTiles.forEach((...params) => flipTile(...params, guess));
}

function flipTile(tile, index, array, guess){
  const letter = tile.dataset.letter;
  const key = keyboard.querySelector(`[data-key="${letter}"i]`)
  setTimeout(() => {
    tile.classList.add("flip")
  }, index * FLIP_ANIMATION_DURATION / 2);

  tile.addEventListener("transitionend", () =>{
    tile.classList.remove("flip");

    //CHECK IF IS CORRECT
    if(targetWord[index] === letter){
      tile.dataset.state = "correct";
      key.classList.add("correct");
    }else if(targetWord.includes(letter)){
      tile.dataset.state = "wrong-location";
      key.classList.add("wrong-location");
    }else{
      tile.dataset.state = "wrong";
      key.classList.add("wrong");
    }

    if(index === array.length - 1){
      tile.addEventListener("transitionend", () => {
        startInteraction();
        checkWinLose(guess, array);
      }, {once: true})
    }
  }, {once: true})
}

function getActiveTiles(){
  return guessGrid.querySelectorAll('[data-state="active"]')
}

function showAlert(msg, duration = 1000){
  const alert = document.createElement("div");
  alert.textContent = msg;
  alert.classList.add("alert");
  alertContainer.prepend(alert);
  if(duration == null){
    return;
  }

  setTimeout(() =>{
    alert.classList.add("hide")
    alert.addEventListener("transitionend", () =>{
      alert.remove();
    });
  }, duration);
}

function shakeTiles(tiles){
  tiles.forEach(tile => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake")
      },
      {once: true}
    );
  })
}

function checkWinLose(guess, tiles){
  if(guess === targetWord){
    showAlert("You Win", 5000);
    danceTiles(tiles);
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if(remainingTiles.length === 0){
    showAlert(targetWord.toUpperCase(), null);
    stopInteraction();
    const allTiles = guessGrid.querySelectorAll(".tile");
    shakeTiles(allTiles);
    allTiles.forEach(tile =>{
      tile.classList.add("lost");
    });
  }
}

function danceTiles(tiles){
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        {once: true}
      )
    }, index * DANCE_ANIMATION_DURATION / 5);
  })
}