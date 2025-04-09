/************************************/
/*  GLOBAL VARIABLES                */
/************************************/
let w;
let h;
let pix = 1;

// Visual stuff
let s, c, pg, pg2, img, sh;
let f, g;
let frameMod;

let borderStr;
let border;
let blockColor, blockColor2, blockColor3;
let stopCount = 1;
let far;
let blockW, blockH;
let yatayChooser;
let sChooser;

let ellipseChooser;
let akChooser;
let dirChooser;
let borderBox;
let newi;
let lineDir;

// Flicker / Brightness detection
let flick = false; // whether flicker was detected this frame

// 32×32 downsample buffers
let smallFrame;      // current 32×32 frame
let smallPrevFrame;  // previous 32×32 frame
let analysisPG;      // flicker detection output (32×32, WEBGL)
let brightnessPG;    // brightness detection output (32×32, WEBGL)
let flickerSh;       // flicker-detection shader
let brightnessSh;    // brightness detection shader
let doAnalysis = false; // toggles every few frames

// Mouse / overlay
let clickCount = 0;  // how many times the user has clicked

// Audio stuff
let kickOsc, kickEnv, kickFilter;
let snareOsc, snareEnv, snareFilter;
let percOsc, percEnv, percFilter;
let percOsc2, percEnv2, percFilter2;
let synthOsc, synthEnv, synthFilter;
let pitchShifter;
let aksak, noiseOsc, noiseOscFilter;
let aksakNoise, aksak2, envMult;
let hitToggle = 0;

let highpf;
let lowpf;
let masterGain;
let currentFilter = null;

let notes;
let randomNote;

/************************************/
/*  PRELOAD                         */
/************************************/
function preload() {
  // Adjust the file names if needed
  flickerSh = loadShader("flicker.vert", "flicker.frag");
  brightnessSh = loadShader("flicker.vert", "brightness.frag");
  sh = loadShader("pix.vert", "pix.frag");

  newi = loadImage("1.png");
  seed1 = 999999999 * random(1);
}

/************************************/
/*  SETUP                           */
/************************************/
function setup() {
  w = windowWidth;
  h = windowHeight;

  // Main canvas in WEBGL
  c = createCanvas(w, h, WEBGL);
  pixelDensity(pix);

  // Offscreen for background usage
  f = createGraphics(w, h);
  f.pixelDensity(pix);
  f.colorMode(HSB, 360, 100, 100, 1);

  // Graphics for shapes
  pg = createGraphics(w, h);
  pg.pixelDensity(pix);
  pg.noStroke();

  pg2 = createGraphics(w, h);
  pg2.pixelDensity(pix);
  pg2.noStroke();

  // Another image layer
  img = createGraphics(w, h);
  img.pixelDensity(pix);
  img.imageMode(CENTER);
  img.colorMode(HSB, 360, 100, 100, 1);
  img.rectMode(CENTER);

  f.rectMode(CENTER);
  f.background(0, 0, 10);

  // DOWNSAMPLED BUFFERS (32×32) FOR ANALYSIS
  smallFrame = createGraphics(32, 32); // P2D by default
  smallFrame.pixelDensity(1);

  smallPrevFrame = createGraphics(32, 32);
  smallPrevFrame.pixelDensity(1);
  smallPrevFrame.background(0);

  analysisPG = createGraphics(32, 32, WEBGL);
  analysisPG.pixelDensity(1);

  brightnessPG = createGraphics(32, 32, WEBGL);
  brightnessPG.pixelDensity(1);

  console.log(seed1);
  noiseSeed(seed1);
  randomSeed(seed1);

  // Choose a framerate
  let frArr = [25, 50, 75, 50, 25, 50, 75, 50, 50, 75];
  frameMod = 64;
  far = 30;
  frameRate(far);

  // Render the initial background
  introCanvas();

  // Additional setup
  initSetup();

  // Set up the audio
  audioSetup();

  aksak = 16;
  aksakNoise = 4;
  aksak2 = 32;
  envMult = 1;
}

/************************************/
/*  DRAW                            */
/************************************/
function draw() {
  // Original shape logic
  let x = (random(w / s) ^ (frameCount / s)) * s;
  let y = (random(h / s) ^ (frameCount / s)) * s;

  for (let i = 0; i < 3; i += 1) {
    pg.fill(random([0, 255, 127]), random([0, 255, 127]), random([0, 255, 127]));
    pg.rect(x, y, s * 2, s * 2);

    pg2.fill(random([0, 255, 127]), random([0, 255, 127]), random([0, 255, 127]));
    pg2.rect(x, y, s * 2, s * 2);
  }

  if (border == 1.0) {
    pg2.push();
    pg2.fill(blockColor, blockColor2, blockColor3);
    pg2.rectMode(CENTER);
    if (yatayChooser == 0.0) {
      pg2.push();
      pg2.translate(blockW, height / 2);
      pg2.rect(0, 0, width / 10, height);
      pg2.pop();

      pg2.push();
      pg2.translate(blockW - width / 5, height / 2);
      pg2.rect(0, 0, width / 10, height);
      pg2.pop();

      pg2.push();
      pg2.translate(blockW + width / 5, height / 2);
      pg2.rect(0, 0, width / 10, height);
      pg2.pop();
    } else if (yatayChooser == 1.0) {
      pg2.push();
      pg2.translate(width / 2, blockH);
      pg2.rect(0, 0, width, height / 10);
      pg2.pop();

      pg2.push();
      pg2.translate(width / 2, blockH - height / 5);
      pg2.rect(0, 0, width, height / 10);
      pg2.pop();

      pg2.push();
      pg2.translate(width / 2, blockH + height / 5);
      pg2.rect(0, 0, width, height / 10);
      pg2.pop();
    }
    pg2.pop();
  }

  // Draw the image layer
  c.image(img, w / 2, h / 2);
  img.image(c, w / 2, h / 2);

  // Possibly change shape pattern every frameMod frames
  if (frameCount % frameMod == 0) {
    minDim = min(width, height);

    sChooser = random([1.0, 2.0, 3.0]);
    ellipseChooser = random([0.0, 0.0, 1.0, 0.0]);

    if (frameMod == 25) {
      akChooser = random([1, 2]);
    } else {
      akChooser = random([1, 2, 3, 4, 1, 2]);
    }

    dirChooser = random([1.0, 2.0, 3.0]);
    border = random([0.0, 0.0, 1.0, 0.0, 0.0]);
    yatayChooser = random([0.0, 1.0]);
    lineDir = random([0.0, 1.0]);

    if (sChooser == 1.0) {
      s = random([minDim / 10, minDim / 5, minDim / 20, minDim / 10, minDim / 50]);
    } else if (sChooser == 2.0) {
      s = random([minDim / 50, minDim / 20, minDim / 50, minDim / 20]);
    } else if (sChooser == 3.0) {
      s = random([minDim / 10, minDim / 5, minDim / 10, minDim / 5]);
    }

    for (let yy = 0; yy < h; yy += s) {
      for (let xx = 0; xx < w; xx += s) {
        pg2.fill(random([0, 255, 127]), random([0, 255, 127]), random([0, 255, 127]));
        if (ellipseChooser == 0.0) {
          pg2.rect(xx, yy, s, s);
        } else {
          pg2.ellipse(xx, yy, s, s);
        }
      }
    }

    if (akChooser == 1.0) {
      sh.setUniform('ak', random([1., 1., 2.0, 1., 1., 2.0, 3., 1., 1., 1.]));
    } else if (akChooser == 2.0) {
      sh.setUniform('ak', 3.0);
    } else if (akChooser == 3.0) {
      sh.setUniform('ak', 5.0);
    } else if (akChooser == 4.0) {
      sh.setUniform('ak', 10.0);
    }

    let dX = random([1., -1., 0.0, 0.0]);
    let dY;
    if (dX == 1. || dX == -1) {
      dY = 0.0;
    } else {
      dY = random([-1, 1]);
    }
    if (dirChooser == 1.0) {
      sh.setUniform('dirX', dX);
      sh.setUniform('dirY', dY);
    } else if (dirChooser == 2.0) {
      sh.setUniform('dirX', random([-1., 1.]));
      sh.setUniform('dirY', random([-1., 1.]));
    } else if (dirChooser == 3.0) {
      sh.setUniform('dirX', random([-1., 1., 0., 0., 0.]));
      sh.setUniform('dirY', random([-1., 1., 0., 0., 0.]));
    }
    sh.setUniform('u_lineDir', lineDir);

    blockColor = random([255, 127]);
    blockColor2 = random([255, 127]);
    blockColor3 = random([255, 127]);

    blockW = random([width / 2, width / 4, width / 1.3333]);
    blockH = random([height / 2, height / 4, height / 1.3333]);

    // Audio triggers:
    notes = ["D5", "F5", "A5", "D6"];
    randomNote = random(notes);

    aksak = random([16, 16, 16, 24, 24, 24, 24, 12, 8, 16, 16, 16]);

    if (s == minDim / 50) {
      kickEnv.decay = 0.01;
      snareOsc.envelope.attack = 0.001;
      snareOsc.envelope.decay = 0.001;
      envMult = 5;
      percEnv.attack = 0.00005;
      percEnv.decay = 0.00002;
      percOsc.volume.value = 5;
      noiseOsc.volume.value = -18;
      snareOsc.volume.value = 5;
      randomNote = "A5";
    } else if (s == minDim / 20) {
      kickEnv.decay = 0.1;
      snareOsc.envelope.attack = 0.005;
      snareOsc.envelope.decay = 0.01;
      envMult = 2;
      percEnv.attack = 0.00005;
      percEnv.decay = 0.00002;
      percOsc.volume.value = 5;
      noiseOsc.volume.value = -20;
      snareOsc.volume.value = -3;
      randomNote = "D5";
    } else if (s == minDim / 10) {
      kickEnv.decay = 0.2;
      snareOsc.envelope.attack = 0.01;
      snareOsc.envelope.decay = 0.1;
      envMult = 1;
      percEnv.attack = 0.0005;
      percEnv.decay = 0.0002;
      percOsc.volume.value = -3;
      noiseOsc.volume.value = -22;
      snareOsc.volume.value = -9;
      randomNote = "A4";
    } else if (s == minDim / 5) {
      kickEnv.decay = 0.2;
      snareOsc.envelope.attack = 0.01;
      snareOsc.envelope.decay = 0.1;
      envMult = 1;
      percEnv.attack = 0.0005;
      percEnv.decay = 0.0002;
      percOsc.volume.value = -3;
      noiseOsc.volume.value = -22;
      snareOsc.volume.value = -9;
      randomNote = "D4";
    }

    if (dirChooser == 1.0) {
      aksak = random([12, 8, 16, 16]);
      synthFilter.frequency = "16n";
    } else if (dirChooser == 2.0) {
      aksak = random([16, 16, 16, 12, 16, 16, 12]);
      synthFilter.frequency = "12n";
    } else if (dirChooser == 3.0) {
      aksak = random([16, 16, 16, 24, 24, 24, 24]);
      synthFilter.frequency = "8n";
    }

    aksakNoise = random([4, 4, 4, 4, 4, 4, 4]);
    aksak2 = random([32, 16, 32, 16, 24, 24, 12, 12, 16, 32, 32, 32]);
  }

  // Send uniforms for pix.frag
  sh.setUniform("u_time", frameCount / 10.0);
  sh.setUniform("pg", pg2);
  sh.setUniform("img", img);
  sh.setUniform("pg2", pg2);

  // Draw the fullscreen quad with the main shader
  quad(-1, -1, 1, -1, 1, 1, -1, 1);

  // ------------------------------------------------------
  // DOWNSAMPLE & CONDITIONAL ANALYSIS
  // ------------------------------------------------------
  // 1) Downsample the main canvas into smallFrame
  smallFrame.clear();
  // draw the entire c.elt onto the 32×32 buffer
  smallFrame.drawingContext.drawImage(c.elt, 0, 0, 32, 32);

  // 2) We only analyze every 5th frame to save CPU
  if (frameCount % 5 === 0) {
    doAnalysis = true;
  } else {
    doAnalysis = false;
  }

  if (doAnalysis) {
    // Flicker detection
    analysisPG.push();
    analysisPG.clear();
    analysisPG.shader(flickerSh);

    flickerSh.setUniform("u_currentFrame", smallFrame);
    flickerSh.setUniform("u_prevFrame", smallPrevFrame);
    flickerSh.setUniform("u_resolution", [32, 32]);

    analysisPG.quad(-1, -1, 1, -1, 1, 1, -1, 1);
    analysisPG.pop();

    analysisPG.loadPixels(); // only 32×32
    let r = analysisPG.pixels[0]; // R channel of first pixel
    if (r > 80) {
      flick = true;
      console.log("Flicker detected!");
      // optional: flicker-based audio
      if (Tone.context.state == "running") {
        if (frameCount % 2 == 0) {
          if (random() < 0.9) {
            percEnv2.triggerAttackRelease("64n");
          }
        }
      }
    } else {
      flick = false;
    }

    // Brightness detection
    brightnessPG.push();
    brightnessPG.clear();
    brightnessPG.shader(brightnessSh);

    brightnessSh.setUniform("u_frame", smallFrame);
    brightnessSh.setUniform("u_resolution", [32, 32]);

    brightnessPG.quad(-1, -1, 1, -1, 1, 1, -1, 1);
    brightnessPG.pop();

    brightnessPG.loadPixels();
    let pixData = brightnessPG.pixels;
    let sumBright = 0;
    let numPixels = 32 * 32;

    for (let i = 0; i < pixData.length; i += 4) {
      sumBright += pixData[i]; // R channel
    }
    let avgBright = sumBright / numPixels;

    // Apply your bright/dark logic
    if (avgBright > 190) {
      console.log("Mostly White Canvas");
      if (currentFilter !== highpf) {
        if (Tone.context.state == "running") {
          masterGain.disconnect();
          masterGain.connect(highpf);
          currentFilter = highpf;
        }
      }
    } else if (avgBright < 30) {
      console.log("Mostly Black Canvas");
      if (currentFilter !== lowpf) {
        if (Tone.context.state == "running") {
          masterGain.disconnect();
          masterGain.connect(lowpf);
          currentFilter = lowpf;
        }
      }
    } else {
      if (currentFilter !== null) {
        if (Tone.context.state == "running") {
          masterGain.disconnect();
          masterGain.toDestination();
          currentFilter = null;
        }
      }
    }

    // Update smallPrevFrame
    smallPrevFrame.clear();
    smallPrevFrame.image(smallFrame, 0, 0, 32, 32);
  }

  // Audio triggers
  if (Tone.context.state == "running") {
    if (frameCount % aksak == 0) {
      kickEnv.triggerAttackRelease("8n");
    }
    if (frameCount % aksak2 == 0) {
      if (random() < 0.9) {
        snareOsc.triggerAttackRelease("8n");
        snareFilter.frequency.value = random(500, 800) * 4;
      }
    }
    if (frameCount % 4 == 0) {
      if (random() < 0.6) {
        percEnv.triggerAttackRelease("32n");
        percFilter.frequency.value = random(1000, 5000);
      }
    }
    if (frameCount % aksakNoise == 0) {
      if (random() < 0.6) {
        noiseOsc.triggerAttackRelease("32n");
        noiseOsc.envelope.decay = random([0.1, 0.1, 0.1, 0.9, 0.45, 0.1]) / envMult;
      }
    }
    if (ellipseChooser == 1.0) {
      if (frameCount % 4 == 0) {
        if (random() < 0.9) {
          synthOsc.triggerAttackRelease(randomNote, "32n");
        }
      }
    }
  }
}

/************************************/
/*  MOUSE / KEY EVENTS              */
/************************************/
function mousePressed() {
  clickCount++;

  if (clickCount === 1) {
    // Start audio context if not running
    if (Tone.context.state !== "running") {
      Tone.start().then(() => {
        console.log("Audio context started!");
      });
    }
    // Hide the HTML overlay
    let overlay = document.getElementById("overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  } 
  else if (clickCount === 2) {
    // Open external link in a new tab
    window.open("https://distcs.xyz", "_blank");
  }
}

function keyPressed() {
  if (key == ' ') {
    stopCount += 1;
    if (stopCount % 2 == 0) {
      frameRate(0);
    } else {
      frameRate(far);
    }
  }
  if (key == "s") {
    saveCanvas("strained", "png");
  }
}

/************************************/
/*  INTRO CANVAS                    */
/************************************/
function introCanvas() {
  f.push();
  f.rectMode(CENTER);
  f.fill(0, 0, 50);
  f.rect(w / 2, h / 2, w * 2, h * 2);

  f.push();
  translate(-width / 2, -height / 2);
  let minDim = min(width, height);
  let si = minDim / 20;
  for (let x = 0; x <= width; x += si) {
    for (let y = 0; y <= height; y += si) {
      f.fill(0, 0, random(30, 65));
      f.rect(x, y, si - x, si - x);
    }
  }
  f.pop();
  f.pop();
}

/************************************/
/*  INIT SETUP                      */
/************************************/
function initSetup() {
  let minDim = min(width, height);

  sChooser = random([1.0, 2.0, 3.0, 1.0]);
  if (sChooser == 1.0) {
    s = minDim / 10;
  } else if (sChooser == 2.0) {
    s = minDim / 50;
  } else if (sChooser == 3.0) {
    s = minDim / 20;
  }

  ellipseChooser = random([0.0, 0.0, 1.0, 0.0, 0.0]);
  ellipseChooser = 0;

  if (frameMod == 25) {
    akChooser = random([1, 2]);
  } else {
    akChooser = random([1, 2, 3, 4, 1, 2]);
  }

  dirChooser = random([1.0, 2.0, 3.0, 3.0]);

  let dX = random([1., -1., 0.0, 0.0]);
  let dY;
  if (dX == 1. || dX == -1) {
    dY = 0.0;
  } else {
    dY = random([-1, 1]);
  }

  let proD = random([0.1, 0.5]);
  lineDir = random([0.0, 1.0]);

  // Set main shader
  shader(sh);
  sh.setUniform("resolution", [w * pix, h * pix]);
  sh.setUniform("pg", pg2);
  sh.setUniform("pg2", pg2);
  sh.setUniform("img", f);
  sh.setUniform("proD", proD);
  sh.setUniform("u_lineDir", lineDir);

  if (dirChooser == 1.0) {
    sh.setUniform("dirX", dX);
    sh.setUniform("dirY", dY);
  } else if (dirChooser == 2.0) {
    sh.setUniform("dirX", random([-1., 1.]));
    sh.setUniform("dirY", random([-1., 1.]));
  } else if (dirChooser == 3.0) {
    sh.setUniform("dirX", random([-1., 1., 0., 0., 0.]));
    sh.setUniform("dirY", random([-1., 1., 0., 0., 0.]));
  }

  if (akChooser == 1.0) {
    sh.setUniform("ak", 1.);
  } else if (akChooser == 2.0) {
    sh.setUniform("ak", 3.0);
  } else if (akChooser == 3.0) {
    sh.setUniform("ak", 5.0);
  } else if (akChooser == 4.0) {
    sh.setUniform("ak", 10.0);
  }

  sh.setUniform("satOn", dirChooser);

  img.image(f, w / 2, h / 2);

  blockColor = 255;
  blockColor2 = 255;
  blockColor3 = 255;

  blockW = width / 2;
  blockH = height / 2;
  border = random([0.0, 0.0, 1.0, 1.0, 0.0]);
  if (border == 1.0) borderStr = "border";
  yatayChooser = random([0.0, 1.0]);
}

/************************************/
/*  AUDIO SETUP (Tone.js)           */
/************************************/
function audioSetup() {
  kickOsc = new Tone.Oscillator("B1", "sine").start();
  kickEnv = new Tone.AmplitudeEnvelope({
    attack: 0.001,
    decay: 0.2,
    sustain: 0.0,
    release: 0.1,
  });
  kickFilter = new Tone.Filter({
    frequency: 100,
    type: "lowpass",
    rolloff: -24
  });
  kickOsc.connect(kickFilter);
  kickFilter.connect(kickEnv);

  snareOsc = new Tone.NoiseSynth({
    noise: {
      type: "white",
    },
    envelope: {
      attack: 0.005,
      decay: 0.01,
      sustain: 0.0,
      release: 1.0,
    },
  });
  snareFilter = new Tone.Filter({
    frequency: 1500,
    type: "bandpass",
    rolloff: -12,
    Q: 1
  });
  snareOsc.volume.value = -9;
  snareOsc.connect(snareFilter);

  percOsc = new Tone.Oscillator("G3", "triangle").start();
  percEnv = new Tone.AmplitudeEnvelope({
    attack: 0.0005,
    decay: 0.0002,
    sustain: 0.0,
    release: 0.1,
  });
  percFilter = new Tone.Filter({
    frequency: 1200,
    type: "lowpass",
    rolloff: -24
  });
  percOsc.volume.value = 3;
  percOsc.connect(percFilter);
  percFilter.connect(percEnv);

  percOsc2 = new Tone.Oscillator("G5", "sawtooth").start();
  percEnv2 = new Tone.AmplitudeEnvelope({
    attack: 0.005,
    decay: 0.002,
    sustain: 0.0,
    release: 0.01,
  });
  percFilter2 = new Tone.Filter({
    frequency: 6200,
    type: "highpass",
    rolloff: -24
  });
  percOsc2.volume.value = -4;
  percOsc2.connect(percFilter2);
  percFilter2.connect(percEnv2);

  noiseOsc = new Tone.NoiseSynth({
    noise: {
      type: "white",
    },
    envelope: {
      attack: 0.0005,
      decay: 0.1,
      sustain: 0.0,
      release: 1.0,
    },
  });
  noiseOscFilter = new Tone.Filter({
    frequency: 15000,
    type: "lowpass",
    rolloff: -12,
    Q: 1
  });
  noiseOsc.volume.value = -22;
  noiseOsc.connect(noiseOscFilter);

  synthOsc = new Tone.DuoSynth({
    voice0: {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.005,
        decay: 0.0005,
        sustain: 0.0,
        release: 1.5,
      },
    },
    voice1: {
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.001,
        decay: 0.001,
        sustain: 0.0,
        release: 1.0,
      },
    },
  });
  synthFilter = new Tone.AutoFilter({
    frequency: "8n",
    depth: 1.0,
    baseFrequency: 100,
    octaves: 4,
    filter: {
      type: "lowpass",
      rolloff: -24,
      Q: 1,
    },
  }).start();
  synthOsc.volume.value = -18;
  synthFilter.type = "sine";

  pitchShifter = new Tone.PitchShift({
    pitch: 24,
    windowSize: 0.5,
    delayTime: 0.01,
    feedback: 0.01,
  });

  synthOsc.connect(synthFilter);
  const reverb = new Tone.Reverb({
    decay: 2,
    preDelay: 0.01,
    wet: 0.5,
  });
  synthFilter.connect(reverb);
  reverb.toDestination();

  highpf = new Tone.Filter({
    frequency: 1000,
    type: "highpass",
    rolloff: -24,
  }).toDestination();

  lowpf = new Tone.Filter({
    frequency: 500,
    type: "lowpass",
    rolloff: -24,
  }).toDestination();

  masterGain = new Tone.Gain().toDestination();

  // Connect all sound sources to masterGain
  kickEnv.connect(masterGain);
  snareFilter.connect(masterGain);
  percEnv.connect(masterGain);
  percEnv2.connect(masterGain);
  noiseOscFilter.connect(masterGain);
  synthFilter.connect(masterGain);
}
