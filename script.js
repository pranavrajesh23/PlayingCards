let deck = [];
let history = [];
let tableau = [[], [], [], [], [], [], []];
let foundations = [[], [], [], []];
let stock = [];
let waste = [];
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let tableauColumns;
let foundationPiles;
let packDiv;
let restDiv;
let undoBtn;
let newBtn;
let timerInterval;
let secondsElapsed = 0;
let timerDisplay;
const gameSound = new Audio("click.mp3");
gameSound.preload = "auto";
const win = new Audio("win.mp3");
win.preload = "auto";
win.currentTime=0;

function playGameSound() {
    gameSound.currentTime = 0; // rewind to start
    gameSound.play();
}


document.getElementById && (document.getElementById("undo") && (/* placeholder to avoid errors if run before DOM */ 0));

let moveCount = 0;
let moveDisplay;
let scoreDisplay;
let score = 0;
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}


document.addEventListener("DOMContentLoaded", () => {
    // Now DOM exists — get elements
    tableauColumns = document.querySelectorAll('.tableau');
    foundationPiles = document.querySelectorAll('.foundation');
    packDiv = document.getElementById("pack");
    restDiv = document.getElementById("rest");
    moveDisplay = document.getElementById("moveCounter");
    undoBtn = document.getElementById("undo");
    newBtn = document.getElementById("new");
    timerDisplay = document.getElementById("timer"); // make sure you have <span id="timer"></span> in HTML
    startTimer();
    scoreDisplay = document.getElementById("scoreBoard");
    score = 0;
    updateScoreDisplay();


    // attach undo/new handlers
    if (undoBtn) undoBtn.onclick = undoMove;
    if (newBtn) {
      newBtn.onclick = function() {
        deck = [];
        stock = [];
        waste = [];
        tableau = [[],[],[],[],[],[],[]];
        history = [];
        foundations = [[], [], [], []];
        secondsElapsed = 0
        score = 0;
        updateScoreDisplay();
        // Clear tableau and stock
        if (packDiv) packDiv.innerHTML = "";
        if (restDiv) restDiv.innerHTML = "";
        tableauColumns.forEach(col => col.innerHTML = "");

        // Reset foundations visually
        foundationPiles.forEach(pile => pile.innerHTML = `<p>${pile.getAttribute("data-suit")}</p>`);

        // Reset move count
        moveCount = 0;
        if (moveDisplay) moveDisplay.textContent = `Moves: 0`;

        // New game setup
        createDeck();
        shuffleDeck();
        dealTableau();
        createStock();
        renderFoundations();
        renderTableau();
        renderWaste();
        StockToSeen();
      };
    }
    createDeck();
    shuffleDeck();
    dealTableau();
    createStock();
    renderFoundations();
    renderTableau();
    renderWaste();
    StockToSeen();
    attachTableauDropHandlers();
    attachFoundationDropHandlers();
});

function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({suit: suit, value: value, faceUp:false});
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealTableau() {
  tableau = [[], [], [], [], [], [], []];
  let cardIndex = 0;
  tableauColumns.forEach((col) => col.innerHTML = "");
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= i; j++) {
      const card = deck[cardIndex];
      if (j === i) card.faceUp = true;
      tableau[i].push(card);
      const cardDiv = card.faceUp ? createFaceUpCard(card, i, j) : createFaceDownCard();
      cardDiv.style.top = j * 50 + 'px';
      tableauColumns[i].appendChild(cardDiv);
      cardIndex++;
    }
  }
  stock = deck.slice(cardIndex);
//   for(var i=cardIndex;i<52-cardIndex;i++)
//   {
//     console.log(stock[i]);
//   }
}

function createFaceUpCard(card, fromColumn, cardIndex) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.setAttribute('draggable', true);
    cardDiv.innerHTML = `<span>${card.value}${card.suit}</span>
                         <span class="middle">${card.suit}</span>
                         <span class="bottom">${card.value}${card.suit}</span>`;
    cardDiv.style.backgroundColor = 'white';
    cardDiv.style.borderRadius = "15px";
    cardDiv.style.color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';

    cardDiv.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            value: card.value,
            suit: card.suit,
            fromColumn: fromColumn,
            cardIndex: cardIndex,
            // if fromColumn === 'foundation', calling code should set foundationIndex in dragstart override if needed
        }));
    });

    cardDiv.addEventListener('click', () => {
        playGameSound()
        // attemptAutoMove may modify tableau/foundations and should update move count and history
        const moved = attemptAutoMove(card, fromColumn, cardIndex);
        if (moved) {
            // increment and update UI handled inside attemptAutoMove where appropriate
            renderTableau();
            renderFoundations();
            renderWaste();
        }
    });

    return cardDiv;
}

function createFaceDownCard() {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.textContent = '';
    cardDiv.style.backgroundImage = "url('card.jpg')";
    cardDiv.style.backgroundSize = "cover";
    cardDiv.style.backgroundPosition = "center";
    cardDiv.style.borderRadius = "15px";
    return cardDiv;
}

function createStock(){
  if (!packDiv) packDiv = document.getElementById("pack");
  packDiv.innerHTML = "";
  // represent each unseen card as a back
  for (let i = 0; i < stock.length; i++) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.textContent = '';
    cardDiv.style.backgroundImage = "url('card.jpg')";
    cardDiv.style.backgroundSize = "cover";
    cardDiv.style.backgroundPosition = "center";
    packDiv.appendChild(cardDiv);
  }
}

function StockToSeen() {
  if (!packDiv) packDiv = document.getElementById("pack");
  packDiv.onclick = function() {
    playGameSound();
    if (stock.length > 0) {
      const card = stock.pop();
      card.faceUp = true;
      waste.push(card);
      history.push({ type: "stockToWaste", card: card });
      renderWaste();
      createStock(); // refresh pack visuals

      if (stock.length === 0 && packDiv.lastChild) {
        packDiv.lastChild.style.backgroundImage = "url('empty.jpeg')";
        packDiv.lastChild.style.backgroundSize = "cover";
        packDiv.lastChild.style.backgroundPosition = "center";
      }

      moveCount++;
      if (moveDisplay) moveDisplay.textContent = `Moves: ${moveCount}`;

    } else {
      // recycle
      if (waste.length > 0) {
        stock = [...waste].reverse();
        // record recycle with a shallow copy of cards (by value)
        history.push({ type: "recycleWaste", cards: [...stock] });
        waste = [];
        createStock();
        renderWaste();

        moveCount++;
        if (moveDisplay) moveDisplay.textContent = `Moves: ${moveCount}`;
      }
    }
  };
}

function attachTableauDropHandlers() {
    tableauColumns.forEach((col, colIndex) => {
        col.addEventListener('dragover', (e) => e.preventDefault()); // allow drop

        col.addEventListener('drop', (e) => {
            e.preventDefault();

            const raw = e.dataTransfer.getData('text/plain');
            if (!raw) return;
            const data = JSON.parse(raw);
            let movingCards = [], card;

            // Get the card(s) to move
            if (data.fromColumn === "waste") {
                if (waste.length === 0) return;
                card = waste[waste.length - 1];
                movingCards = [card];
            } else if (data.fromColumn === "foundation") {
                const pileIndex = data.foundationIndex;
                if (!foundations[pileIndex] || foundations[pileIndex].length === 0) return;
                card = foundations[pileIndex][foundations[pileIndex].length - 1];
                movingCards = [card];
            } else {
                const fromColumn = data.fromColumn;
                // find the card in source column by match (value + suit)
                card = tableau[fromColumn].find(c => c.value === data.value && c.suit === data.suit);
                if (!card) return;
                const cardIndex = tableau[fromColumn].indexOf(card);
                movingCards = tableau[fromColumn].slice(cardIndex);
            }

            const targetColumn = tableau[colIndex];
            const targetCard = targetColumn[targetColumn.length - 1];

            // Validate move
            if (targetCard && !canPlaceOnTableau(card, targetCard)) return; // illegal
            if (!targetCard && movingCards[0].value !== 'K') return; // only King on empty column

            // Remove from original place AFTER validation and record history
            if (data.fromColumn === "waste") {
                waste.pop();
                renderWaste();
                history.push({
                    type: "wasteToTableau",
                    card: card,
                    toColumn: colIndex
                });
            } else if (data.fromColumn === "foundation") {
                const pileIndex = data.foundationIndex;
                foundations[pileIndex].pop();
                renderFoundations();
                history.push({
                    type: "foundationToTableau",
                    card: card,
                    fromFoundation: pileIndex,
                    toColumn: colIndex
                });
            } else {
                const fromColumn = data.fromColumn;
                const cardIndex = tableau[fromColumn].indexOf(card);
                // remove movingCards from source
                tableau[fromColumn].splice(cardIndex, movingCards.length);

                // if a card is revealed by this removal, flip it and record that flip
                let flippedCard = null;
                const lastCardIndex = tableau[fromColumn].length - 1;
                if (lastCardIndex >= 0 && !tableau[fromColumn][lastCardIndex].faceUp) {
                    tableau[fromColumn][lastCardIndex].faceUp = true;
                    flippedCard = { value: tableau[fromColumn][lastCardIndex].value, suit: tableau[fromColumn][lastCardIndex].suit };
                }

                // store the whole moved stack (so undo can restore multi-card moves)
                history.push({
                    type: "tableauToTableau",
                    cards: movingCards.slice(), // store references to card objects
                    fromColumn: fromColumn,
                    toColumn: colIndex,
                    flippedCard: flippedCard
                });
            }

            // Place into tableau
            tableau[colIndex] = tableau[colIndex].concat(movingCards);
            renderTableau();

            moveCount++;
            if (moveDisplay) moveDisplay.textContent = `Moves: ${moveCount}`;
            if (checkWin()) showWinBanner();
        });
    });
}

function attachFoundationDropHandlers() {
    foundationPiles.forEach((pile, pileIndex) => {
        pile.addEventListener('dragover', (e) => e.preventDefault());

        pile.addEventListener('drop', (e) => {
            e.preventDefault();

            const raw = e.dataTransfer.getData('text/plain');
            if (!raw) return;
            const data = JSON.parse(raw);

            let card;
            let fromColumn = data.fromColumn;
            if (data.fromColumn === "waste") {
                if (waste.length === 0) return;
                card = waste[waste.length - 1]; // peek
            }
            else if (data.fromColumn === "foundation") {
                // cannot move from one foundation onto another in classic Klondike — ignore
                return;
            }
            else {
              const tableauColumn = tableau[fromColumn];
              const topCard = tableauColumn[tableauColumn.length - 1];
              // if the dragged card is not the top card, ignore
              if (!topCard || topCard.value !== data.value || topCard.suit !== data.suit) {
                  return; // cannot move buried cards to foundation
              }
              card = topCard;
            }

            const suit = pile.getAttribute("data-suit");
            if (!canPlaceOnFoundation(card, suit)) return;

            // remove card from origin and capture flipped info if any
            const removedInfo = removeCardFromOrigin(card, fromColumn, (data.fromColumn === "foundation" ? data.foundationIndex : data.cardIndex));

            // push into foundation and record history
            if (fromColumn === "waste") {
                history.push({
                    type: "wasteToFoundation",
                    card: card,
                    foundationIndex: pileIndex,
                    flippedCard: null
                });
                score+=5;
                updateScoreDisplay();
            } else {
                history.push({
                    type: "tableauToFoundation",
                    card: card,
                    fromColumn: fromColumn,
                    foundationIndex: pileIndex,
                    flippedCard: removedInfo.flippedCard ? { value: removedInfo.flippedCard.value, suit: removedInfo.flippedCard.suit } : null
                });
                score+=10;
                updateScoreDisplay();
            }

            foundations[pileIndex].push(card);
            
            renderTableau();
            renderFoundations();

            moveCount++;
            if (moveDisplay) moveDisplay.textContent = `Moves: ${moveCount}`;

            if (checkWin()) showWinBanner();
        });
    });
}

function renderTableau() {
    tableauColumns.forEach((col, i) => {
        col.innerHTML = '';
        tableau[i].forEach((card, j) => {
            const cardDiv = card.faceUp ? createFaceUpCard(card, i, j) : createFaceDownCard();
            cardDiv.style.top = j * 30 + 'px';
            col.appendChild(cardDiv);
        });
    });
}

function renderWaste() {
    if (!restDiv) restDiv = document.getElementById("rest");
    restDiv.innerHTML = '';
    if (waste.length > 0) {
        const topCard = waste[waste.length - 1];
        const cardDiv = createFaceUpCard(topCard, "waste", waste.length - 1);
        restDiv.appendChild(cardDiv);
    }
}

function canPlaceOnTableau(draggedCard, targetCard) {
    const valuesOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const draggedValueIndex = valuesOrder.indexOf(draggedCard.value);
    const targetValueIndex = valuesOrder.indexOf(targetCard.value);

    const colors = { '♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red' };

    return colors[draggedCard.suit] !== colors[targetCard.suit] &&
           draggedValueIndex === targetValueIndex - 1;
}

function canPlaceOnFoundation(card, suit) {
  const pileIndex = suits.indexOf(suit);
  const pile = foundations[pileIndex];

  const valuesOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  if (card.suit !== suit) return false;
  if (pile.length === 0) {
      return card.value === 'A';
  }

  const topCard = pile[pile.length - 1];
  const cardIndex = valuesOrder.indexOf(card.value);
  const topIndex = valuesOrder.indexOf(topCard.value);

  return cardIndex === topIndex + 1;
}

function renderFoundations() {
    foundationPiles.forEach((pile, i) => {
        // Read suit from data attribute (safer than relying on existing <p>)
        const suitSymbol = pile.getAttribute("data-suit") || (pile.querySelector('p') && pile.querySelector('p').textContent) || suits[i];
        pile.innerHTML = `<p>${suitSymbol}</p>`;
        if (foundations[i].length > 0) {
            const topCard = foundations[i][foundations[i].length - 1];
            const cardDiv = createFaceUpCard(topCard, "foundation", i);

            // ensure dragstart sets foundation index
            cardDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    value: topCard.value,
                    suit: topCard.suit,
                    fromColumn: "foundation",
                    foundationIndex: i
                }));
            });

            pile.appendChild(cardDiv);
        }
    });
}

function removeCardFromOrigin(card, fromColumn, cardIndex) {
    if (fromColumn === "waste") {
        waste.pop();
        renderWaste();
        return { flippedCard: null };
    } else if (fromColumn === "foundation") {
        foundations[cardIndex].pop(); // cardIndex is foundation index
        renderFoundations();
        return { flippedCard: null };
    } else {
        // remove one card from tableau at cardIndex
        const removed = tableau[fromColumn].splice(cardIndex, 1);
        const lastCardIndex = tableau[fromColumn].length - 1;
        let flippedCard = null;
        if (lastCardIndex >= 0 && !tableau[fromColumn][lastCardIndex].faceUp) {
            // we flipped a card as a result of removal — record it
            tableau[fromColumn][lastCardIndex].faceUp = true;
            flippedCard = tableau[fromColumn][lastCardIndex];
        }
        return { flippedCard };
    }
}

function attemptAutoMove(card, fromColumn, cardIndex) {
    // --- TRY TO MOVE TO FOUNDATION (only single-card moves) ---
    // For tableau source ensure the card is the top card (can't move buried cards to foundation)
    const isTableauSource = (typeof fromColumn === 'number');
    if (!isTableauSource || tableau[fromColumn][tableau[fromColumn].length - 1] === card) {
        for (let f = 0; f < foundations.length; f++) {
            const suit = suits[f];
            if (canPlaceOnFoundation(card, suit)) {
                // remove origin and capture flip info (if any)
                const removedInfo = removeCardFromOrigin(card, fromColumn, cardIndex);

                // push to foundation
                foundations[f].push(card);

                // record history + score
                if (fromColumn === "waste") {
                    history.push({ type: "wasteToFoundation", card, foundationIndex: f, flippedCard: null });
                    score += 5;
                } else if (fromColumn === "foundation") {
                    // moving from foundation to foundation is not allowed generally; we won't reach here normally
                    history.push({ type: "foundationToFoundation", card, fromFoundation: cardIndex, foundationIndex: f, flippedCard: null });
                } else {
                    // from tableau
                    history.push({
                        type: "tableauToFoundation",
                        card,
                        fromColumn,
                        foundationIndex: f,
                        flippedCard: removedInfo.flippedCard ? { value: removedInfo.flippedCard.value, suit: removedInfo.flippedCard.suit } : null
                    });
                    score += 10;
                }

                updateScoreDisplay();
                renderTableau();
                renderFoundations();
                renderWaste();

                moveCount++;
                if (moveDisplay) moveDisplay.textContent = `Moves: ${moveCount}`;

                if (checkWin()) showWinBanner();
                return true;
            }
        }
    }

    // --- TRY TO MOVE TO TABLEAU ---
    // CASE A: single-card sources (waste or foundation) — treat as single-card move
    if (fromColumn === "waste" || fromColumn === "foundation") {
        for (let t = 0; t < tableau.length; t++) {
            const targetCol = tableau[t];
            const targetTop = targetCol[targetCol.length - 1];

            // validate
            if (targetTop) {
                if (!canPlaceOnTableau(card, targetTop)) continue;
            } else {
                if (card.value !== 'K') continue; // only king to empty
            }

            // remove from origin
            removeCardFromOrigin(card, fromColumn, (fromColumn === "foundation" ? cardIndex : cardIndex));
            // push onto tableau
            tableau[t].push(card);

            // history
            if (fromColumn === "waste") {
                history.push({ type: "wasteToTableau", card, toColumn: t });
            } else { // foundation -> tableau
                history.push({ type: "foundationToTableau", card, fromFoundation: cardIndex, toColumn: t, flippedCard: null });
            }

            renderTableau();
            renderFoundations();
            renderWaste();

            moveCount++;
            if (moveDisplay) moveDisplay.textContent = `Moves: ${moveCount}`;
            return true;
        }
        return false;
    }

    // CASE B: source is a tableau column -> attempt stack move (clicking a card should move it and its tail)
    if (typeof fromColumn === 'number') {
        const fromIdx = fromColumn;
        const cardIndexInCol = tableau[fromIdx].indexOf(card);
        if (cardIndexInCol === -1) return false;

        const movingStack = tableau[fromIdx].slice(cardIndexInCol);

        // Try each target column
        for (let t = 0; t < tableau.length; t++) {
            if (t === fromIdx) continue;
            const targetCol = tableau[t];
            const targetTop = targetCol[targetCol.length - 1];

            // Validate using the head (first card of moving stack)
            if (targetTop) {
                if (!canPlaceOnTableau(movingStack[0], targetTop)) continue;
            } else {
                if (movingStack[0].value !== 'K') continue; // only king on empty
            }

            // remove the stack from source
            tableau[fromIdx].splice(cardIndexInCol, movingStack.length);

            // if a card got revealed, flip it and record
            let flippedCard = null;
            const lastIndex = tableau[fromIdx].length - 1;
            if (lastIndex >= 0 && !tableau[fromIdx][lastIndex].faceUp) {
                tableau[fromIdx][lastIndex].faceUp = true;
                flippedCard = { value: tableau[fromIdx][lastIndex].value, suit: tableau[fromIdx][lastIndex].suit };
            }

            // append the whole stack to target
            tableau[t] = tableau[t].concat(movingStack);

            // history (store the whole moved stack)
            history.push({
                type: "tableauToTableau",
                cards: movingStack.slice(),
                fromColumn: fromIdx,
                toColumn: t,
                flippedCard: flippedCard
            });

            renderTableau();

            moveCount++;
            if (moveDisplay) moveDisplay.textContent = `Moves: ${moveCount}`;

            if (checkWin()) showWinBanner();
            return true;
        }

        return false;
    }

    // default: couldn't move
    return false;
}



function checkWin() {
    for (let pile of foundations) {
        if (pile.length !== 13) return false;
    }
    return true;
}

function showWinBanner() {
    win.play()
    const banner = document.getElementById("winBanner");
    if (!banner) return;
    banner.style.display = "block";
    
    setTimeout(() => banner.style.opacity = 1, 10); // fade in

    // Hide after 2 seconds and reset game
    setTimeout(() => {
        banner.style.opacity = 0;
        setTimeout(() => {
            banner.style.display = "none";
            if (newBtn) newBtn.click(); // start new game
        }, 500); // wait for fade-out transition
    }, 2000);
}

function undoMove() {
    if (history.length === 0) return;

    const lastMove = history.pop();

    switch (lastMove.type) {
        case "stockToWaste":
            waste.pop();
            stock.push(lastMove.card);
            renderWaste();
            createStock();
            break;

        case "recycleWaste":
            stock = [];
            waste = [...lastMove.cards];
            renderWaste();
            createStock();
            break;

        case "wasteToTableau":
            tableau[lastMove.toColumn].pop();
            waste.push(lastMove.card);
            renderWaste();
            renderTableau();
            break;

        case "wasteToFoundation":
            foundations[lastMove.foundationIndex].pop();
            waste.push(lastMove.card);
            score -= 5;
            updateScoreDisplay();
            renderFoundations();
            renderWaste();
            break;

        case "tableauToTableau": {
            const movedCards = lastMove.cards || (lastMove.card ? [lastMove.card] : []);
            // remove those cards from the destination (they should be on top)
            for (let i = 0; i < movedCards.length; i++) {
                tableau[lastMove.toColumn].pop();
            }
            // push them back onto the original column in the same order
            tableau[lastMove.fromColumn].push(...movedCards);

            // if we recorded a flipped card when moving, set it back to faceDown
            if (lastMove.flippedCard) {
                const fc = tableau[lastMove.fromColumn].find(c => c.value === lastMove.flippedCard.value && c.suit === lastMove.flippedCard.suit);
                if (fc) fc.faceUp = false;
            }

            renderTableau();
            break;
        }

        case "tableauToFoundation": {
            foundations[lastMove.foundationIndex].pop();
            tableau[lastMove.fromColumn].push(lastMove.card);

            // revert any flip that happened on the source tableau
            if (lastMove.flippedCard) {
                const fc = tableau[lastMove.fromColumn].find(c => c.value === lastMove.flippedCard.value && c.suit === lastMove.flippedCard.suit);
                if (fc) fc.faceUp = false;
            }
            score -= 10;               // Subtract points for undo
            updateScoreDisplay();
            renderFoundations();
            renderTableau();
            break;
        }

        case "foundationToTableau": {
            // remove from tableau
            tableau[lastMove.toColumn].pop();
            // put back into foundation
            foundations[lastMove.fromFoundation].push(lastMove.card);

            renderTableau();
            renderFoundations();
            break;
        }

        default:
            // unknown move type — do nothing
            break;
    }

    // reduce move count
    if (moveCount > 0) {
        moveCount--;
        if (moveDisplay) moveDisplay.textContent = `Moves: ${moveCount}`;
    }
}
function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function resetTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    if (!timerDisplay) return;
    let mins = Math.floor(secondsElapsed / 60);
    let secs = secondsElapsed % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}
