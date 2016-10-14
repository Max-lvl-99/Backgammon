var canvas;
var gl;
var colorLoc;
var modelViewLoc;
var projectionLoc;

var vertices = [];
var colors = [];
var shadowColor = vec4(0.0, 0.0, 0.0, 1.0);
var indices = [];
var theta = [];
var angles = [];
var c = [];
var s = [];
var colors = [];

var cubeSize = 10;
var cubeHeight = 1;
var cubeSize2 = cubeSize / 2.0;
var windowMin = -cubeSize2;
var windowMax = cubeSize + cubeSize2;
var light = vec3(cubeSize2, cubeSize * 2, cubeSize2); // position of light

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var rotate = false;
//Determines CW or CCW rotation
var CW;
var firstTimeThrough = true;

var projection;
var modelView;
var shadowProjection;
var aspect;
var x1; var x2;
var index = 0;
//These are the triangles that the pieces are on.
//true is one color, false is another color
var slots = [];
var die1 = 0;
var die2 = 0;
//When its the first turn to move, player can determine by die1 or die1 amount.
var moveDie1Amount;
var currentPlayer = true;
//these two vars are the indices in slots where the bars are.  When moving checkes skip over these.

var bar1SlotNum=6;
var bar2SlotNum=18;
var numCheckersOnBoard=30;


window.onload = function init() {
    initSlots();
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    drawSquare();
    console.log("Indices.length: " + indices.length, "Vertices.length: " + vertices.length,  "Index: " + index, "Colors.length: " + colors.length);
    drawTriangles();


    for(var i=0;i<numCheckersOnBoard;i++){
        vertices.push(vec4(1,1,1,1)); vertices.push(vec4(1,1,1,1));
        vertices.push(vec4(1,1,1,1)); vertices.push(vec4(1,1,1,1));
        vertices.push(vec4(1,1,1,1)); vertices.push(vec4(1,1,1,1));
        colors.push(vec4(1, 1, 1, 1.0)); colors.push(vec4(1, 1, 1, 1.0));
    }

    console.log("Indices.length: " + indices.length, "Vertices.length: " + vertices.length,  "Index: " + index, "Colors.length: " + colors.length);

    drawPieces();
    console.log("Indices.length: " + indices.length, "Vertices.length: " + vertices.length,  "Index: " + index, "Colors.length: " + colors.length);

    // Load indices to represent the triangles that will draw each face
    indices = [
        1, 0, 3, 3, 2, 1,  // front face
        2, 3, 7, 7, 6, 2,  // right face
        3, 0, 4, 4, 7, 3,  // bottom face
        6, 5, 1, 1, 2, 6,  // top face
        4, 5, 6, 6, 7, 4,  // back face
        5, 4, 0, 0, 1, 5,   // left face
    ];
    //Add the indices for drawing the triangles on top of the board.
    for (var i = 8; i < index; i++) {
        indices.push(i);
    }

    theta[0] = 90.0;
    theta[1] = 0.0;
    theta[2] = 0.0;

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = canvas.width / canvas.height;
    gl.clearColor(0.7, 0.7, 0.7, 1.0);
    gl.enable(gl.DEPTH_TEST);
    //projection = ortho (windowMin, windowMax, windowMin, windowMax, windowMin, windowMax+cubeSize);
    // Register event listeners for the buttons
    buttonAffects();

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorLoc = gl.getUniformLocation(program, "color");
    modelViewLoc = gl.getUniformLocation(program, "modelView");
    projectionLoc = gl.getUniformLocation(program, "projection");

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var iBuffer = gl.createBuffer();

    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
    console.log('vertices.length: ' + vertices.length);

    console.log('after for loop vertices.length: ' + vertices.length);


    render();
};

function render() {

    console.log('render() called');
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (rotate) {
        if(CW){theta[axis] = theta[axis] - .5;}
        else{theta[axis] += 0.5;}

    }
    for (i = 0; i < 3; i++) {
        angles[i] = radians(theta[i]);
        c[i] = Math.cos(angles[i]);
        s[i] = Math.sin(angles[i]);
    }

    rx = mat4(1.0, 0.0, 0.0, 0.0,
        0.0, c[0], -s[0], 0.0,
        0.0, s[0], c[0], 0.0,
        0.0, 0.0, 0.0, 1.0);

    ry = mat4(c[1], 0.0, s[1], 0.0,
        0.0, 1.0, 0.0, 0.0,
        -s[1], 0.0, c[1], 0.0,
        0.0, 0.0, 0.0, 1.0);

    rz = mat4(c[2], -s[2], 0.0, 0.0,
        s[2], c[2], 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0);

    tz1 = mat4(1.0, 0.0, 0.0, -cubeSize2,
        0.0, 1.0, 0.0, -cubeSize2,
        0.0, 0.0, 1.0, -cubeSize2,
        0.0, 0.0, 0.0, 1.0);

    tz2 = mat4(1.0, 0.0, 0.0, cubeSize2,
        0.0, 1.0, 0.0, cubeSize2,
        0.0, 0.0, 1.0, cubeSize2,
        0.0, 0.0, 0.0, 1.0);
    //You can resize the scale here
    looking = lookAt(vec3(cubeSize2, cubeSize2, 2.5 * cubeSize), vec3(cubeSize2, cubeSize2, 0), vec3(0.0, 1.0, 0.0));
    projection = perspective(45.0, aspect, 1, 20 * cubeSize);
    rotation = mult(rz, mult(ry, rx));
    modelView = mult(looking, mult(tz2, mult(rotation, tz1)));
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
    //index = vertices.length;
    //console.log("Indices.length: " + indices.length, "Vertices.length: " + vertices.length,  "Index: " + index, "Colors.length: " + colors.length);
    for (var i = 0; i < index; i = i + 3) {
        gl.uniform4fv(colorLoc, colors[i / 3]);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, i);
    }

    requestAnimFrame (render);

};

function drawTriangles() {
    //draw triangles (top row from left to right)
    for (var i = 0; i < 13; i++) {
        x1 = i * (cubeSize * (1 / 13));
        x2 = (i + 1) * (cubeSize * (1 / 13));
        //draw the bar in the middle
        if (i == 6) {
            vertices.push(vec4(x1, cubeHeight + .01, 0, 1.0));
            vertices.push(vec4(x1, cubeHeight + .01, cubeSize, 1.0));
            //this is the middle vertex of the triangle
            vertices.push(vec4(x2, cubeHeight + .01, 0, 1.0));
            //Draw the other triangle to make a rectangle
            index = index + 3;
            colors.push(vec4(0, 0, 0, 1));
            continue;
        }
        vertices.push(vec4(x1, cubeHeight + .01, 0, 1.0));
        vertices.push(vec4(x2, cubeHeight + .01, 0, 1.0));
        //this is the middle vertex of the triangle
        vertices.push(vec4((x1 + x2) / 2, cubeHeight, (7 / 16) * cubeSize, 1.0));
        index = index + 3;
        if (i % 2 == 0) {
            colors.push(vec4(.75, 0, .75, 1.0));
        } else { colors.push(vec4(.35, 0, .35, 1.0)); }
    } //draw triangles (bottom row from left to right)
    for (var i = 0; i < 13; i++) {
        x1 = i * (cubeSize * (1 / 13));
        x2 = (i + 1) * (cubeSize * (1 / 13));
        if (i == 6) {
            vertices.push(vec4(x2, cubeHeight + .01, 0, 1.0));
            //this is the middle vertex of the triangle
            vertices.push(vec4(x1, cubeHeight + .01, cubeSize, 1.0));
            vertices.push(vec4(x2, cubeHeight + .01, cubeSize, 1.0));
            index = index + 3;
            colors.push(vec4(0, 0, 0, 1));
            continue;
        }
        vertices.push(vec4(x1, cubeHeight + .01, cubeSize, 1.0));
        vertices.push(vec4(x2, cubeHeight + .01, cubeSize, 1.0));
        vertices.push(vec4((x1 + x2) / 2, cubeHeight, cubeSize - (7 / 16) * cubeSize, 1.0));
        index = index + 3;
        if (i % 2 != 0) {
            colors.push(vec4(.75, 0, .75, 1.0));
        } else { colors.push(vec4(.35, 0, .35, 1.0)); }
    }
    // index = vertices.length;
    //color triangles.
    // for (var i = 12; i < index; i = i + 3) {
    //     if (i == 18 * 3 - 24) {
    //         colors.push(vec4(0, 0, 0, 1));
    //         colors.push(vec4(0, 0, 0, 1));
    //         i++;
    //         continue;
    //     }
    //     if (i % 2 == 0) {
    //         colors.push(vec4(.75, 0, .75, 1.0));
    //     } else { colors.push(vec4(.35, 0, .35, 1.0)); }
    // }
};

function drawSquare() {


    vertices = [
        //game board
        vec4(0.0, 0.0, cubeSize, 1.0),
        vec4(0.0, cubeHeight, cubeSize, 1.0),
        vec4(cubeSize, cubeHeight, cubeSize, 1.0),
        vec4(cubeSize, 0.0, cubeSize, 1.0),
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(0.0, cubeHeight, 0.0, 1.0),
        vec4(cubeSize, cubeHeight, 0.0, 1.0),
        vec4(cubeSize, 0.0, 0.0, 1.0)
    ];

    // vertices = [
    //     v[1], v[0], v[3], v[3], v[2], v[1],  // front face
    //     v[2], v[3], v[7], v[7], v[6], v[2],  // right face
    //     v[3], v[0], v[4], v[4], v[7], v[3],  // bottom face
    //     v[6], v[5], v[1], v[1], v[2], v[6],  // top face
    //     v[4], v[5], v[6], v[6], v[7], v[4],  // back face
    //     v[5], v[4], v[0], v[0], v[1], v[5],   // left face
    // ];
    index = 36;
    //Make colors for the cube (6 sides, but actually 12 triangles)
    for (var i = 0; i < 12; i++) {
        colors.push(vec4(1.0, 1.0, 0, 1.0));
    }

}

function initSlots() {
    if(!firstTimeThrough){ return; }
    slots = [
        [true, true], //slot 1
        [], //slot 2
        [],
        [],
        [],
        [false, false, false, false, false], // slot 6
        [], // white bar
        [], // slot 7
        [false, false, false],
        [],
        [],
        [],
        [true, true, true, true, true], // slot 12
        [false, false, false, false, false], // slot 13 (opposite side, same end)
        [],
        [],
        [],
        [true, true, true],
        [], // slot 18
        [], // black bar
        [true, true, true, true, true], // slot 19
        [],
        [],
        [],
        [],
        [false, false] // slot 24
    ];

    firstTimeThrough=false;
    //To initialize we need to push dummy vertices so that in drawPieces() we can remove them
    //as if the board is already drawn.
    console.log('end of initSlots().  slots = ' + slots);

}


function drawPieces() {
    //To re-draw the checkers we must remove their old vertices
    for(var i =0; i<numCheckersOnBoard;i++){
        vertices.pop(); vertices.pop(); vertices.pop(); vertices.pop();
        vertices.pop(); vertices.pop();
           colors.pop();   colors.pop();
    }
    console.log('drawPieces() vertices.length: ' + vertices.length);
    var sqWidth, color, v1, v2, v3, v4, ch, i;
    for (i = 0; i < 13; i++) {
        x1 = i * (cubeSize * (1 / 13));
        x2 = (i + 1) * (cubeSize * (1 / 13));

        if (slots[i] && slots[i].length > 0) {
            color = slots[i][0];
            sqWidth = ((7 / 16) * cubeSize) / slots[i].length * 0.9;
            sqSpace = ((7 / 16) * cubeSize) / slots[i].length * 0.1;
            sqWidthMax = cubeSize * (1 / 13) * 0.9;
            sqSpaceMax = cubeSize * (1 / 13) * 0.1;
            if (sqWidth > sqWidthMax) {
                sqWidth = sqWidthMax;
                sqSpace = sqSpaceMax;
            }
            for (ch = 0; ch < slots[i].length; ch += 1) {
                v2 = vec4((x2 + x1) / 2 - sqWidth / 2, cubeHeight + 0.02, sqWidth * ch + sqSpace * (ch + 1), 1.0);
                v1 = vec4((x2 + x1) / 2 + sqWidth / 2, cubeHeight + 0.02, sqWidth * ch + sqSpace * (ch + 1), 1.0);
                v4 = vec4((x2 + x1) / 2 + sqWidth / 2, cubeHeight + 0.02, (sqSpace + sqWidth) * (ch + 1), 1.0);
                v3 = vec4((x2 + x1) / 2 - sqWidth / 2, cubeHeight + 0.02, (sqSpace + sqWidth) * (ch + 1), 1.0);
                vertices.push(v1);
                vertices.push(v2);
                vertices.push(v3);
                vertices.push(v3);
                vertices.push(v4);
                vertices.push(v1);
                index = index + 6;
                if (color) {
                    colors.push(vec4(1, 1, 1, 1.0));
                    colors.push(vec4(1, 1, 1, 1.0));
                } else {
                    colors.push(vec4(0, 0, 0, 1.0));
                    colors.push(vec4(0, 0, 0, 1.0));
                }

            }
        }

    }

    for (i = 0; i < 13; i++) {
        x1 = i * (cubeSize * (1 / 13));
        x2 = (i + 1) * (cubeSize * (1 / 13));

        if (slots[i + 13] && slots[i + 13].length > 0) {
            color = slots[i + 13][0];
            sqWidth = ((7 / 16) * cubeSize) / slots[i + 13].length * 0.9;
            sqSpace = ((7 / 16) * cubeSize) / slots[i + 13].length * 0.1;
            sqWidthMax = cubeSize * (1 / 13) * 0.9;
            sqSpaceMax = cubeSize * (1 / 13) * 0.1;
            if (sqWidth > sqWidthMax) {
                sqWidth = sqWidthMax;
                sqSpace = sqSpaceMax;
            }
            for (ch = 0; ch < slots[i + 13].length; ch += 1) {
                v1 = vec4(cubeSize - ((x2 + x1) / 2 - sqWidth / 2), cubeHeight + 0.02, cubeSize - (sqWidth * ch + sqSpace * (ch + 1)), 1.0);
                v2 = vec4(cubeSize - ((x2 + x1) / 2 + sqWidth / 2), cubeHeight + 0.02, cubeSize - (sqWidth * ch + sqSpace * (ch + 1)), 1.0);
                v3 = vec4(cubeSize - ((x2 + x1) / 2 + sqWidth / 2), cubeHeight + 0.02, cubeSize - ((sqSpace + sqWidth) * (ch + 1)), 1.0);
                v4 = vec4(cubeSize - ((x2 + x1) / 2 - sqWidth / 2), cubeHeight + 0.02, cubeSize - ((sqSpace + sqWidth) * (ch + 1)), 1.0);
                vertices.push(v1);
                vertices.push(v2);
                vertices.push(v3);
                vertices.push(v3);
                vertices.push(v4);
                vertices.push(v1);
                index = index + 6;
                if (color) {
                    colors.push(vec4(1, 1, 1, 1.0));
                    colors.push(vec4(1, 1, 1, 1.0));
                } else {
                    colors.push(vec4(0, 0, 0, 1.0));
                    colors.push(vec4(0, 0, 0, 1.0));
                }
            }
        }

    }
}

//Does not actual start the move.  The user must click "Move Checker" button to move checker
function rollDice() {
    if (die1 != 0 || die2 != 0) {
        alert("You've already rolled the dice!  Either move a piece " +
            "or skip your turn!");
    }
    die1 = Math.ceil(Math.random() * 6);
    die2 = Math.ceil(Math.random() * 6);
    displayDiceRolls();
}

function displayDiceRolls() {
    if (die1 == 0 && die2 == 0) {
        document.getElementById("die1Value").innerHTML = "";
        document.getElementById("die2Value").innerHTML = "";
        return;
    }
    document.getElementById("die1Value").innerHTML = "Die 1 rolled a " + die1 + "!!";
    document.getElementById("die2Value").innerHTML = "  Die 2 rolled a " + die2 + "!!";
}

function switchPlayers() {
    currentPlayer = !currentPlayer;
    if (currentPlayer) {
        document.getElementById("playerTurn").innerHTML = "Player 1 " +
            "(White Checkers) Turn!!";
    } else {
        document.getElementById("playerTurn").innerHTML = "Player 2 " +
            "(Black Checkers) Turn!!";
    }

}

function makeMove() {
    slotToMoveFrom = Math.floor(document.getElementById("slotToMoveFrom").value);
    if (slotToMoveFrom < 0 || slotToMoveFrom > 27) {
        alert("That slot index does not exist!");
    }
    var checkers = slots[slotToMoveFrom];
    if (checkers.length == 0 || currentPlayer != checkers[0]) {
        alert("You have no checkers in this slot!");
        return;
    }
    var spacesToMove;
    if (die1 == 0 && die2 == 0) { alert("You need to roll the dice first!"); return; }
    //next two if's check if only one die is left to move
    if (die1 != 0 && die2 == 0) { spacesToMove = die1; die1 = 0; }
    else if (die2 != 0 && die1 == 0) { spacesToMove = die2; die2 = 0; }
    else if (moveDie1Amount) { spacesToMove = die1; die1 = 0; }
    else if (!moveDie1Amount) { spacesToMove = die2; die2 = 0; }
    else { alert("Something went wrong!!"); return; }
    //We need to skip over the two slots for the bar in the middle, so this function does that
    var newSlot = calculateNewSlot(slotToMoveFrom, spacesToMove);
    //Now we actually have to move the checker to the new slot
    if (slots[newSlot].length != 0) {
        if (slots[newSlot][0] != currentPlayer) {
            //We know that there is at least one of the opponent's checkers in this slot.  If it is only one
            //checker, we bump this checker into the middle bar of the board.
            if (slots[newSlot].length == 1) {
                bumpToMiddle(!currentPlayer); checkerMoved = true;
                //Reset this array since we removed the only piece

                slots[newSlot] = []; 
            }
            else{ alert("You aren't allowed to move to this location!  Too many enemy forces!!");  return; }
        }
    }
    var getNewSlot = slots[newSlot];
    getNewSlot.push(currentPlayer);
    slots[newSlot]=getNewSlot;

    var oldSlotArr = slots[slotToMoveFrom];
    oldSlotArr = oldSlotArr.splice(0, oldSlotArr.length - 1);
    slots[slotToMoveFrom] = oldSlotArr;
    window.onload();
    console.log('end of makeMove().  slots: ' + slots + ' vertices.length: ' + vertices.length);
}

function bumpToMiddle(enemyPlayer) {
    slots[6].push(enemyPlayer);
}

function displayMovedByDieX() {
    if (moveDie1Amount) {
        document.getElementById("dieToMove").innerHTML = "Checker will move based on the die 1 value.";
    } else {
        document.getElementById("dieToMove").innerHTML = "Checker will move based on the die 2 value.";
    }
}

//We need to make sure we skip over the two slots that hold the vertical bar through the middle of the 
//board when we are moving the checker pieces.
function calculateNewSlot(slotToMoveFrom, spacesToMove) {
    //this means we cross over the first bar index in slots
    if (slotToMoveFrom < bar1SlotNum && (slotToMoveFrom + spacesToMove) >= bar1SlotNum) {
        return slotToMoveFrom + spacesToMove + 1;
    } if (slotToMoveFrom < bar2SlotNum && (slotToMoveFrom + spacesToMove) >= bar2SlotNum) {
        return slotToMoveFrom + spacesToMove + 1;
    }
    return slotToMoveFrom + spacesToMove;
}

function buttonAffects() {
    var sT = document.getElementById("skipTurn");
    sT.addEventListener("click", function () {
        die1 = 0; die2 = 0; displayDiceRolls();
        switchPlayers();
    });
    var mM = document.getElementById("makeMove");
    mM.addEventListener("click", function () { makeMove(); switchPlayers(); });
    var mD1 = document.getElementById("die1");
    mD1.addEventListener("click", function () {
        moveDie1Amount = true;
        displayMovedByDieX();
    });
    var mD2 = document.getElementById("die2");
    mD2.addEventListener("click", function () {
        moveDie1Amount = false;
        displayMovedByDieX();
    });
    var rD = document.getElementById("rollDice");
    rD.addEventListener("click", function () { rollDice(); });
    var aCW = document.getElementById("XButtonCW");
    aCW.addEventListener("click", function () { CW = true; axis = xAxis; });
    var aCCW = document.getElementById("XButtonCCW");
    aCCW.addEventListener("click", function () { CW = false; axis = xAxis; });
    var bCW = document.getElementById("YButtonCW");
    bCW.addEventListener("click", function () { CW = true; axis = yAxis; });
    var bCCW = document.getElementById("YButtonCCW");
    bCCW.addEventListener("click", function () { CW = false; axis = yAxis; });
    var cCW = document.getElementById("ZButtonCW");
    cCW.addEventListener("click", function () { CW = true; axis = zAxis; });
    var cCCW = document.getElementById("ZButtonCCW");
    cCCW.addEventListener("click", function () { CW = false; axis = zAxis; });
    var d = document.getElementById("Reset");
    d.addEventListener("click", function () { theta = [90, 0.0, 0.0]; axis = xAxis; });
    var e = document.getElementById("StartStop");
    e.addEventListener("click", function () { rotate = !rotate; });
}