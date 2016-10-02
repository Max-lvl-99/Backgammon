var canvas;
var gl;
var colorLoc;
var modelViewLoc;
var projectionLoc;

var vertices = [];
var colors = [];
var shadowColor = vec4 (0.0, 0.0, 0.0, 1.0);
var indices = [];
var theta = [];
var angles  = [];
var c = [];
var s = [];
var colors = [];

var cubeSize = 10;
var cubeHeight = 1;
var cubeSize2 = cubeSize / 2.0;
var windowMin = -cubeSize2;
var windowMax = cubeSize + cubeSize2;
var light = vec3(cubeSize2, cubeSize*2, cubeSize2); // position of light

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var rotate = false;
//Determines CW or CCW rotation
var CW;

var projection;
var modelView;
var shadowProjection;
var aspect;

var index=0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Load vertices and colors for cube faces
    
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
    index= index+8;
    var x1; var x2;
        // for(i=0;i<13;i++){
        //     x1=(1/28)+i*(cubeSize*(1/14));
        //     x2=(1/28)+(i+1)*(cubeSize*(1/14));
        //     vertices.push(vec4(x1, cubeHeight+.01, cubeSize, 1.0));
        //     vertices.push(vec4(x2, cubeHeight+.01, cubeSize, 1.0));
        //     vertices.push(vec4((x1+x2)/2, cubeHeight, cubeSize-(7/16)*cubeSize, 1.0));
        //     index=index+3;
        // }
       //draw triangles (top row)
        for(i=0;i<13;i++){
            x1 = (3/28)+i*(cubeSize*(1/14));
            x2=(3/28)+(i+1)*(cubeSize*(1/14));
            //draw the bar in the middle
            if(i==6){            
                vertices.push(vec4(x1, cubeHeight+.01, 0, 1.0));
                vertices.push(vec4(x1, cubeHeight+.01, cubeSize, 1.0));
                //this is the middle vertex of the triangle
                vertices.push(vec4(x2, cubeHeight+.01, 0, 1.0));
                //Draw the other triangle to make a rectangle
                vertices.push(vec4(x2, cubeHeight+.01, 0, 1.0));
                //this is the middle vertex of the triangle
                vertices.push(vec4(x1, cubeHeight+.01, cubeSize, 1.0));
                vertices.push(vec4(x2, cubeHeight+.01, cubeSize, 1.0));
                index = index+6;
                continue;
            }
            vertices.push(vec4(x1, cubeHeight+.01, 0, 1.0));
            vertices.push(vec4(x2, cubeHeight+.01, 0, 1.0));
            //this is the middle vertex of the triangle
            vertices.push(vec4((x1+x2)/2, cubeHeight,(7/16)*cubeSize, 1.0));
            index = index+3;
        } //draw triangles (bottom row)
        for(i=0;i<13;i++){
            x1=(1/28)+i*(cubeSize*(1/14));
            x2=(1/28)+(i+1)*(cubeSize*(1/14));
            vertices.push(vec4(x1, cubeHeight+.01, cubeSize, 1.0));
            vertices.push(vec4(x2, cubeHeight+.01, cubeSize, 1.0));
            vertices.push(vec4((x1+x2)/2, cubeHeight, cubeSize-(7/16)*cubeSize, 1.0));
            index=index+3;
        }

    //Make colors for the cube (6 sides, but actually 12 triangles)
    for(i=0;i<12;i++){
        colors.push(vec4(1.0,1.0,0,1.0));
    } //Draw grey triangles.
    for(i=12;i<index;i++){
        if(i==18){
            colors.push(vec4(0,0,0,1));
            colors.push(vec4(0,0,0,1));
            continue;
        }
        if(i%2==0){
            colors.push(vec4(.6,0,.6,1.0));
        } else { colors.push(vec4(.3,0,.3,1.0)); }
    }
    
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
    for(var i = 8; i<index;i++){
        indices.push(i);
    }
    console.log('indices: ' + indices);
    theta[0] = 90.0;
    theta[1] = 0.0;
    theta[2] = 0.0;
    
    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width / canvas.height;
    gl.clearColor( 0.7, 0.7, 0.7, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    //projection = ortho (windowMin, windowMax, windowMin, windowMax, windowMin, windowMax+cubeSize);
    // Register event listeners for the buttons
    
    var aCW=document.getElementById ("XButtonCW");
    aCW.addEventListener ("click", function() { CW=true;axis = xAxis; });
    var aCCW=document.getElementById ("XButtonCCW");
    aCCW.addEventListener ("click", function() { CW=false;axis = xAxis; });
    var bCW=document.getElementById ("YButtonCW");
    bCW.addEventListener ("click", function () { CW=true;axis = yAxis; });
    var bCCW=document.getElementById ("YButtonCCW");
    bCCW.addEventListener ("click", function () { CW=false;axis = yAxis; });
    var cCW=document.getElementById ("ZButtonCW");
    cCW.addEventListener ("click", function () { CW=true;axis = zAxis; });
    var cCCW=document.getElementById ("ZButtonCCW");
    cCCW.addEventListener ("click", function () { CW=false;axis = zAxis; });
    var d=document.getElementById ("Reset");
    d.addEventListener ("click", function () { theta = [90, 0.0, 0.0]; axis = xAxis; });
    var e=document.getElementById ("StartStop");
    e.addEventListener ("click", function () { rotate = !rotate; });

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    colorLoc = gl.getUniformLocation (program, "color");
    modelViewLoc = gl.getUniformLocation (program, "modelView");
    projectionLoc  = gl.getUniformLocation (program, "projection");
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var iBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
    
    render();
};

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (rotate) {
        if(CW){theta[axis] =theta[axis] - .5;}
        else{theta[axis] += 0.5;}
    }
    for (i=0; i<3; i++) {
        angles[i] = radians(theta[i]);
        c[i] = Math.cos(angles[i]);
        s[i] = Math.sin(angles[i]);
    }
    
    rx = mat4 (1.0, 0.0, 0.0, 0.0,
               0.0, c[0], -s[0], 0.0,
               0.0, s[0], c[0], 0.0,
               0.0, 0.0, 0.0, 1.0);
                   
    ry = mat4 (c[1], 0.0, s[1], 0.0,
               0.0, 1.0, 0.0, 0.0,
               -s[1], 0.0, c[1], 0.0,
               0.0, 0.0, 0.0, 1.0);
    
    rz = mat4 (c[2], -s[2], 0.0, 0.0,
               s[2], c[2], 0.0, 0.0,
               0.0, 0.0, 1.0, 0.0,
               0.0, 0.0, 0.0, 1.0);
    
    tz1 = mat4 (1.0, 0.0, 0.0, -cubeSize2,
               0.0, 1.0, 0.0, -cubeSize2,
               0.0, 0.0, 1.0, -cubeSize2,
               0.0, 0.0, 0.0, 1.0);
               
    tz2 = mat4 (1.0, 0.0, 0.0, cubeSize2,
               0.0, 1.0, 0.0, cubeSize2,
               0.0, 0.0, 1.0, cubeSize2,
               0.0, 0.0, 0.0, 1.0);
    //You can resize the scale here
    looking = lookAt (vec3(cubeSize2,cubeSize2,2.5*cubeSize), vec3(cubeSize2,cubeSize2,0), vec3(0.0, 1.0, 0.0));
    projection = perspective (45.0, aspect, 1, 20*cubeSize);
    rotation = mult (rz, mult(ry, rx));
    modelView = mult(looking, mult(tz2, mult (rotation, tz1)));
    gl.uniformMatrix4fv (modelViewLoc, false, flatten(modelView));
    gl.uniformMatrix4fv (projectionLoc, false, flatten(projection));
    
    for (var i=0; i<index; i=i+3) {
        gl.uniform4fv (colorLoc, colors[i/3]);
        gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, i );
    }
    
    // // Do the shadow.
    // shadowProjection = mat4();
    // shadowProjection[3][3] = 0;
    // shadowProjection[3][1] = -1/light[1];
    // modelView = mult(modelView, translate(light[0], light[1], light[2]));
    // modelView = mult(modelView, shadowProjection);
    // modelView = mult(modelView, translate(-light[0], -light[1], -light[2]));
    // gl.uniformMatrix4fv (modelViewLoc, false, flatten(modelView));
    // gl.uniform4fv(colorLoc, shadowColor);
    // for (var i=0; i<index; i+=3){
    //     gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, i);
    // }

    requestAnimFrame (render);
};
