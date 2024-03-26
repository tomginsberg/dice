
const playerInputContainer = document.getElementById('playerInputContainer');
const playerNamesInput = document.getElementById('playerNames');
const currentPlayerDisplay = document.getElementById('currentPlayer');
let players = [];
let currentPlayerIndex = 0;
let viewMode = 'histogram'; // can be 'histogram' or 'playerTimes'
let playerTimes = {};
let startTime;

const dice1 = document.getElementById('dice1');
const dice2 = document.getElementById('dice2');
const rollButton = document.getElementById('rollButton');
const message = document.getElementById('message');
const diceSound = new Audio('assets/dice.ogg');
const attackSound = new Audio('assets/attack.ogg');
const allySound = new Audio('assets/ally.ogg');
const paul1 = new Audio('assets/paul1.ogg');
const paul2 = new Audio('assets/paul2.ogg');
const paul3 = new Audio('assets/paul3.ogg');

const showHistogram = document.getElementById('showHistogram');
const histogram = document.getElementById('histogram').getContext('2d');
const diceUrls = [
    'https://www.svgrepo.com/show/499118/dice-one.svg',
    'https://www.svgrepo.com/show/499122/dice-two.svg',
    'https://www.svgrepo.com/show/499121/dice-three.svg',
    'https://www.svgrepo.com/show/499119/dice-four.svg',
    'https://www.svgrepo.com/show/499117/dice-five.svg',
    'https://www.svgrepo.com/show/499120/dice-six.svg',
    'https://www.svgrepo.com/show/143418/question-mark-inside-square.svg'
];

let rolls = generateRolls();
let rollCounts = {};
let activeIntervals = 1;
document.getElementById('toggleSwitch').addEventListener('change', toggleView);


function generateRolls() {
    const rolls = [];
    for (let i = 1; i <= 6; i++) {
        for (let j = 1; j <= 6; j++) {
            rolls.push([i, j]);
        }
    }
    rolls.push('wild');
    shuffleArray(rolls);
    return rolls;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function rollDice() {
    diceSound.play();
    rollButton.classList.add('disabled'); // Add the disabled class
    rollButton.disabled = true; // Disable the button

    const roll = rolls.pop();

    if (roll === 'wild') {
        message.innerText = 'Wild card... resetting';
        dice1.src = diceUrls[6]; // Set the dice1 icon to the question mark icon
        dice2.src = diceUrls[6]; // Set the dice2 icon to the question mark icon
        setTimeout(() => {
            message.innerText = '';
            rolls = generateRolls();
            rollCounts = {};
            rollButton.classList.remove('disabled'); // Remove the disabled class
            rollButton.disabled = false; // Enable the button after 2 seconds
        }, 2000);
        return;
    }
    nextTurn();

    dice1.src = diceUrls[roll[0] - 1];
    dice2.src = diceUrls[roll[1] - 1];
    setColorSquare('colorSquare1');

    const rollSum = roll[0] + roll[1];
    rollCounts[rollSum] = (rollCounts[rollSum] || 0) + 1;
    if (viewMode === 'histogram') {
        updateHistogram();
    } else {
        updatePlayerTimesChart();
    }

    setTimeout(() => {
        rollButton.classList.remove('disabled'); // Remove the disabled class
        rollButton.disabled = false; // Enable the button after 2 seconds
    }, 1000);
}

function setColorSquare(squareId) {
    const randomValue = Math.random();

    let chosenColor;

    if (randomValue < 0.5) {
        chosenColor = 'black';
        incrementStatusBar();
    } else if (randomValue < 0.66) {
        chosenColor = 'yellow';
    } else if (randomValue < 0.83) {
        chosenColor = 'green';
    } else {
        chosenColor = 'blue';
    }

    updateStatusBarColor(chosenColor);
}

function updateStatusBarColor(color) {
    const intervals = document.querySelectorAll('.status-interval.active');
    intervals.forEach(interval => {
        interval.style.backgroundColor = color;
    });
}

function createHistogram() {
    const data = {
        labels: Array.from({ length: 11 }, (_, i) => i + 2),
        datasets: [
            {
                data: Array.from({ length: 11 }, (_, i) => rollCounts[i + 2] || 0),
                backgroundColor: '#4CAF50',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { display: false },
            },
            y: {
                grid: { display: false },
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    callback: (value) => (Number.isInteger(value) ? value : null),
                },
            },
        },
    };

    return new Chart(histogram, {
        type: 'bar',
        data: data,
        options: options,
    });
}


function startGame() {
    const names = playerNamesInput.value.split(',').map(name => name.trim());
    if (names.length < 1) {
        alert('Please enter at least one player name.');
        return;
    }

    players = names;
    playerInputContainer.style.display = 'none';
    document.getElementById('mainUI').style.display = 'block'; // Show the main UI
    players.forEach(player => {
        playerTimes[player] = 0;
    });
    rollDice();
}

function nextTurn() {
    if (startTime) {
        const endTime = new Date();
        const timeTaken = (endTime - startTime) / 1000 / 60; // in mins
        const previousPlayer = players[currentPlayerIndex - 1] || players[players.length - 1];
        playerTimes[previousPlayer] += timeTaken;
    }
    if (currentPlayerIndex >= players.length) {
        currentPlayerIndex = 0;
    }

    if((levenshteinDistance('ally', players[currentPlayerIndex])<= 2) || levenshteinDistance('allison', players[currentPlayerIndex])<= 2){
        allySound.play();
    }
    else if(levenshteinDistance('paul', players[currentPlayerIndex])<=2){
        const randomValue = Math.random();
        if (randomValue < 0.33) {
            paul1.play();
        } else if (randomValue < 0.66) {
            paul2.play();
        } else {
            paul3.play();
        }
    }

    currentPlayerDisplay.textContent = `${players[currentPlayerIndex]}'s Turn`;
    currentPlayerIndex++;
    startTime = new Date();
}

function toggleView() {
    if (window.myChart) {
        window.myChart.destroy();
        window.myChart = null;
    }

    if (viewMode === 'histogram') {
        viewMode = 'playerTimes';
        updatePlayerTimesChart();
    } else {
        viewMode = 'histogram';
        updateHistogram();
    }
}

function updateHistogram() {
    if (!window.myChart) {
        window.myChart = createHistogram();
    } else {
        window.myChart.data.datasets[0].data = Array.from(
            { length: 11 },
            (_, i) => rollCounts[i + 2] || 0
        );
        window.myChart.update();
    }
}

function updatePlayerTimesChart() {
    if (!window.myChart) {
        window.myChart = createPlayerTimesChart();
    } else {
        window.myChart.data.labels = Object.keys(playerTimes);
        window.myChart.data.datasets[0].data = Object.values(playerTimes);
        window.myChart.update();
    }
}

function createPlayerTimesChart() {
    const data = {
        labels: Object.keys(playerTimes),
        datasets: [
            {
                data: Object.values(playerTimes),
                backgroundColor: '#4CAF50',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { display: false },
            },
            y: {
                grid: { display: false },
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Time (mins)'
                }
            },
        },
    };

    return new Chart(histogram, {
        type: 'bar',
        data: data,
        options: options,
    });
}

function incrementStatusBar() {
    if (activeIntervals < 7) {
        activeIntervals++;
        document.querySelectorAll('.status-interval')[activeIntervals - 1].classList.add('active');
    } else {
        attackSound.play()
        activeIntervals++;
        document.querySelectorAll('.status-interval')[activeIntervals - 1].classList.add('active');
        updateStatusBarColor('red')

        rollButton.classList.add('disabled'); // Add the disabled class
        rollButton.disabled = true; // Disable the button

        setTimeout(() => {
            rollButton.classList.remove('disabled'); // Remove the disabled class
            rollButton.disabled = false; // Enable the button after 3 seconds
            resetStatusBar();
        }, 1000);
    }
}

function resetStatusBar() {
    activeIntervals = 1;
    const intervals = document.querySelectorAll('.status-interval');
    intervals.forEach(interval => {
        interval.classList.remove('active');
        interval.style.backgroundColor = '#ccc'; // Reset color to the original gray
    });
    intervals[0].classList.add('active');
    intervals[0].style.backgroundColor = ''; // Let the CSS handle the color of the active interval
    updateStatusBarColor('black')
}

function levenshteinDistance(s1, s2) {
    var matrix = [];
    var i, j;

    // Initialize matrix with zeros
    for (i = 0; i <= s1.length; i++) {
        matrix[i] = [i];
    }
    for (j = 0; j <= s2.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the matrix
    for (i = 1; i <= s1.length; i++) {
        for (j = 1; j <= s2.length; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    // Return the bottom-right value of the matrix
    return matrix[s1.length][s2.length];
}