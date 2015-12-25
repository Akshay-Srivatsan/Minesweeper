var widthInput = document.getElementById("width");
var heightInput = document.getElementById("height");
var minesInput = document.getElementById("mines");
var newGame = document.getElementById("newGame");
var endGame = document.getElementById("endGame");
var flagMode = document.getElementById("flagMode");
var digMode = document.getElementById("digMode");
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');

var mode = "dig";
var width = 25;
var height = 25;
var playing = true;
var mines = 50;
var SIZE = 25;

var grid = null;
var state = null;
var target = {x: -1, y: -1};

var uncovered = 0;

function updateInputs() {
    widthInput.value = width;
    heightInput.value = height;
    minesInput.value = mines;
    
    widthInput.disabled = playing;
    heightInput.disabled = playing;
    
    if (mode == "dig") {
        digMode.disabled = true;
        flagMode.disabled = false;
    } else {
        flagMode.disabled = true;
        digMode.disabled = false;
    }
    
    digMode.disabled = digMode.disabled || !playing;
    flagMode.disabled = flagMode.disabled || !playing;
    
    newGame.disabled = playing;
    endGame.disabled = !playing;
}

digMode.addEventListener("click", function() {
    mode = "dig";
    updateInputs();
});

flagMode.addEventListener("click", function() {
    mode = "flag";
    updateInputs();
});

endGame.addEventListener("click", showSolution);

function showSolution() {
    playing = false;
    updateInputs();
    render();
}


function startGame() {
    width = widthInput.value;
    height = heightInput.value;
    mines = minesInput.value;
    
    grid = new Array(height);
    state = new Array(height);
    for (var r = 0; r < height; r++) {
        grid[r] = new Array(width);
        state[r] = new Array(width);
        for (var c = 0; c < width; c++) {
            grid[r][c] = 0;
            state[r][c] = "hidden";
        }
    }
    
    for (var i = 0; i < mines; i++) {
        var r = Math.floor(Math.random() * height);
        var c = Math.floor(Math.random() * width);
        while (grid[r][c] == -1) {
            // Keep going until the current cell isn't a mine
            r = Math.floor(Math.random() * height);
            c = Math.floor(Math.random() * width);
        }
        grid[r][c] = -1;
    }
    
    for (var r = 0; r < height; r++) {
        for (var c = 0; c < width; c++) {
            function count(dx, dy) {
                if (r + dy < 0) return 0;
                if (c + dx < 0) return 0;
                if (r + dy >= height) return 0;
                if (c + dx >= width) return 0;
                if (grid[r + dy][c + dx] == -1) return 1;
                return 0;
            }
            
            var sum = (
                count(-1, -1) +
                count(-1, 0) +
                count(-1, 1) +
                count(0, 1) +
                count(1, 1) +
                count(1, 0) +
                count(1, -1) +
                count(0, -1)
            );
            if (grid[r][c] != -1) {
                grid[r][c] = sum;
            }
            
        }
    }
    
    playing = true;
    updateInputs();
    render();
}

function render() {
    canvas.width = width * SIZE;
    canvas.height = height * SIZE;
    canvas.style.left = (window.innerWidth - canvas.width)/2 + "px";
    canvas.style.top = (window.innerHeight - canvas.height - 50)/2 + "px";
    
    ctx.strokeStyle = "black";
    for (var r = 0; r < height; r++) {
        for (var c = 0; c < width; c++) {
            var x = c * SIZE;
            var y = r * SIZE;
            var s = SIZE;
            ctx.strokeRect(x, y, s, s);
            if (state[r][c] == 'hidden') {
                ctx.fillStyle = "gray";
                if (target.x == c && target.y == r) {
                    ctx.fillStyle = "lightgray";
                    if (!playing) {
                        ctx.fillStyle = "darkred";
                    }
                }
                ctx.fillRect(x, y, s, s);
            } else if (state[r][c] == 'uncovered') {
                ctx.fillStyle = "white";
                ctx.fillRect(x, y, s, s);
                console.log(r, c);
            
                if (grid[r][c] > 0) {
                    ctx.fillStyle = ["blue", "green", "orange", "red", "purple", "brown", "black", "blue", "cyan"][grid[r][c]];
                    ctx.font = "25px Courier";
                    ctx.fillText(grid[r][c], x + 5, y + s - 5);
                }
            } else if (state[r][c] == 'flagged') {
                ctx.fillStyle = "green";
                if (target.x == c && target.y == r) {
                    ctx.fillStyle = "lightgreen";
                }
                ctx.fillRect(x, y, s, s);
            }
            
            if (grid[r][c] == -1 && !playing) {
                ctx.fillStyle = "black";
                ctx.fillRect(x + 5, y + 5, s - 10, s - 10);
            }
        }
    }
}

document.addEventListener("mousemove", function(e) {
    if (!playing) {
        return;
    }
    var x = Math.round(e.x) - parseInt(canvas.style.left) - SIZE/2;
    var y = Math.round(e.y) - parseInt(canvas.style.top) - 50 - SIZE/2;
    if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) {
        target = {x: -1, y: -1};
        render();
        return;
    } else {
        target = {x: Math.round(x/25), y: Math.round(y/25)};
    }
    render();
});

function floodReveal(r, c, area, max) {
    if (r < 0 || c < 0 || r >= height || c >= width) {
        return 0;
    }
    if (area > max) {
        return 0;
    }
    if (state[r][c] == 'uncovered') {
        return 1;
    }
    if (grid[r][c] != 0) {
        state[r][c] = 'uncovered';
        uncovered++;
        return 1;
    }
    state[r][c] = 'uncovered';
    uncovered++;
    var sum = 1;
    sum += floodReveal(r-1, c, area+1+Math.random()*2, max);
    sum += floodReveal(r+1, c, area+1+Math.random()*2, max);
    sum += floodReveal(r, c-1, area+1+Math.random()*2, max);
    sum += floodReveal(r, c+1, area+1+Math.random()*2, max);
    return sum;
}

document.addEventListener("mousedown", function(e) {
    if (target.x == -1 || target.y == -1) {
        return;
    }
    var r = target.y;
    var c = target.x;
    if (mode == "dig") {
        if (state[r][c] == 'flagged') {
            return;
        }
        if (grid[r][c] == -1) {
            showSolution();
        } else {
            floodReveal(r, c, 0, 20*Math.random() + 5);
            // state[r][c] = 'uncovered';
        }
    } else {
        if (state[r][c] == 'hidden') {
            state[r][c] = 'flagged';
        } else if (state[r][c] == 'flagged') {
            state[r][c] = 'hidden';
        }
    }
    if (width*height - uncovered == mines) {
        playing = false;
        alert("You win!");
    }
    render();
});

newGame.addEventListener("click", startGame);

updateInputs();
startGame();
