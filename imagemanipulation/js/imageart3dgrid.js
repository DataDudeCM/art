//----------------------------------------------
// p5.js sketch: Shader-Based “Melt” Distortion
//----------------------------------------------

let meltShader;
let imgTexture;
let intensitySlider;

function preload() {
  // 1) Load the image you want to warp:
  imgTexture = loadImage('../images/jinx2.png'); // Replace with your image path

  // 2) Create the shader from our two source strings:
  meltShader = createShader(vertSource, fragSource);
}

function setup() {
  createCanvas(1000, 1000, WEBGL);
  noStroke();

  // 3) Slider to control distortion intensity (0 → 1):
  intensitySlider = createSlider(0, 100, 30);
  intensitySlider.style('width', '150px');
  intensitySlider.position(10, 10);
}

function draw() {
  background(0);

  // 4) Activate our custom shader:
  shader(meltShader);

  // 5) Pass uniforms:
  //    - uTexture: the loaded image
  //    - uTime: frameCount / 60  (so time increments in seconds)
  //    - uIntensity: slider / 100
  meltShader.setUniform('uTexture', imgTexture);
  meltShader.setUniform('uTime',       frameCount * 0.01);
  meltShader.setUniform('uIntensity',  intensitySlider.value() / 100.0);

  // 6) Draw a full-screen quad (p5.js default fills the canvas in WEBGL)
  rect(-width/2, -height/2, width, height);

  // 7) Draw a small label for the slider in 2D space:
  resetMatrix();
  push();
  translate(-width/2, -height/2);
  noStroke();
  fill(0, 150);
  rect(10, 10, 180, 30);
  fill(255);
  textSize(14);
  text(`Distort: ${(intensitySlider.value()/100).toFixed(2)}`, 20, 32);
  pop();
}


//----------------------------------------------
// Vertex Shader (GLSL)
//----------------------------------------------
const vertSource = `

  // Attributes provided by p5.js
  attribute vec3 aPosition;
  attribute vec2 aTexCoord;

  // Varying to pass UV to the fragment shader
  varying vec2 vTexCoord;

  // Standard uniforms for WEBGL
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    // Pass UVs through
    vTexCoord = aTexCoord;

    // Standard transformation
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
  }
`;


//----------------------------------------------
// Fragment Shader (GLSL) with 2D Perlin (“snoise”)
//----------------------------------------------
const fragSource = `

  precision mediump float;

  // “Classic” GLSL 2D noise (snoise) from Stefan Gustavson:
  // https://github.com/ashima/webgl-noise
  // (public-domain/permitting open use)
  
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0 - sqrt(3.0)) / 6.0
                        0.366025403784439,  // 0.5 * (sqrt(3.0) - 1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    
    // First corner
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other corners
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    // Permutations
    vec3 p = permute(
               permute(i.y + vec3(0.0, i1.y, 1.0))
             + i.x + vec3(0.0, i1.x, 1.0)
           );

    vec3 m = max(0.5 - vec3(
                    dot(x0, x0),
                    dot(x12.xy, x12.xy),
                    dot(x12.zw, x12.zw)
                  ), 0.0);
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;

    return 130.0 * dot(m, g);
  }

  // Varying passed from vertex shader
  varying vec2 vTexCoord;

  // The original image texture
  uniform sampler2D uTexture;

  // Time (increasing) so noise can animate
  uniform float uTime;

  // How strong the distortion is (0 → 1)
  uniform float uIntensity;

  void main() {
    // Base UV coordinate
    vec2 uv = vTexCoord;

    // Build a noise input: we scale UV up so there are multiple “cells” of noise
    // across the image; we also add time so it animates.
    vec2 noiseInput = uv * 3.0 + vec2(uTime * 0.1);

    // Compute a noise value in [–1, +1]
    float n = snoise(noiseInput);

    // Create an offset vector. We can scale it by uIntensity.
    vec2 offset = vec2(n * uIntensity * 0.1, n * uIntensity * 0.1);

    // Sample the texture at the perturbed UV
    vec4 color = texture2D(uTexture, uv + offset);

    gl_FragColor = color;
  }
`;
