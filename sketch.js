/************************************/
/*  GLOBAL VARIABLES (UNCHANGED)    */
/************************************/
let w;
let h
let pix = 1
let s, c, pg, pg2, img, sh
let f, g
let frameMod

let borderStr

let border
let blockColor, blockColor2, blockColor3
let stopCount = 1
let far
let blockW, blockH
let yatayChooser
let sChooser

let ellipseChooser
let akChooser
let dirChooser
let borderBox
let newi
let lineDir

let notes
let randomNote

let finalFrame; // We'll copy the main canvas output here
let analysisPG; // We'll run the flicker shader here (1×1 or bigger)
let prevFrame; // We'll store last frame’s image here
let flickerSh; // The flicker-detection shader



let kickOsc, kickEnv, kickFilter;
let snareOsc, snareEnv, snareFilter;
let percOsc, percEnv, percFilter;
let percOsc2, percEnv2, percFilter2;
let synthOsc, synthEnv, synthFilter;
let hitToggle = 0;
let pitchShifter
let aksak, noiseOsc, noiseOscFilter
let aksakNoise, aksak2, envMult
let flick = false

let highpf
let lowpf
let masterGain
let currentFilter = null;

let brightnessSh;
let brightnessPG;

let overlayActive = true; // starts true so overlay is drawn initially
let clickCount = 0; // how many times user has clicked so far


function preload() {
  brightnessSh = loadShader('flicker.vert', 'brightness.frag');
  sh = loadShader("pix.vert", "pix.frag");
  flickerSh = loadShader("flicker.vert", "flicker.frag"); // <-- FLICKER DETECTION
  seed1 = 999999999 * random(1)
}



function setup() {
  w = windowWidth
  h = windowHeight

  c = createCanvas(w, h, WEBGL)
  pixelDensity(pix)
  f = createGraphics(w, h)
  f.pixelDensity(pix)
  f.colorMode(HSB, 360, 100, 100, 1)
  pg = createGraphics(w, h)
  pg.pixelDensity(pix)
  pg.noStroke()

  f.background(0, 0, 10)

  pg2 = createGraphics(w, h)
  pg2.pixelDensity(pix)
  pg2.noStroke()

  img = createGraphics(w, h)
  img.pixelDensity(pix)
  img.imageMode(CENTER)
  img.colorMode(HSB, 360, 100, 100, 1)
  img.rectMode(CENTER)

  f.rectMode(CENTER)

  // ------------------------------------------------------
  // FLICKER DETECTION SETUP
  // ------------------------------------------------------
  finalFrame = createGraphics(width, height);
  finalFrame.pixelDensity(1);

  analysisPG = createGraphics(32, 32, WEBGL);
  analysisPG.pixelDensity(1);

  brightnessPG = createGraphics(32, 32, WEBGL);
  brightnessPG.pixelDensity(1);

  prevFrame = createGraphics(width, height);
  prevFrame.pixelDensity(1);

  prevFrame.background(0);



  console.log(seed1)
  // seed1 = 315812069.4908319
  // seed1 = 990535095.6915286
  // 21105553.088910386
  // 475685616.7732618
  // 211610999.32637835
  noiseSeed(seed1)
  randomSeed(seed1)



  let frArr = [25, 50, 75, 50, 25, 50, 75, 50, 50, 75]
  frameMod = 64 //frArr[floor(random(frArr.length))]

  far = 30
  frameRate(far)

  introCanvas();

  initSetup();

  audioSetup();

  aksak = 16
  aksakNoise = 4
  aksak2 = 32

  envMult = 1
}


function draw() {

  

  let x = (random(w / s) ^ (frameCount / s)) * s
  let y = (random(h / s) ^ (frameCount / s)) * s

  for (let i = 0; i < 3; i += 1) {
    pg.fill(random([0, 255, 127]), random([0, 255, 127]), random([0, 255, 127]))
    pg.rect(x, y, s * 2, s * 2)

    pg2.fill(random([0, 255, 127]), random([0, 255, 127]), random([0, 255, 127]))
    pg2.rect(x, y, s * 2, s * 2)
  }

  if (border == 1.0) {
    pg2.push()
    pg2.fill(blockColor, blockColor2, blockColor3)
    pg2.rectMode(CENTER)
    if (yatayChooser == 0.0) {
      pg2.push()
      pg2.translate(blockW, height / 2)
      pg2.rect(0, 0, width / 10, height)
      pg2.pop()

      pg2.push()
      pg2.translate(blockW - width / 5, height / 2)
      pg2.rect(0, 0, width / 10, height)
      pg2.pop()

      pg2.push()
      pg2.translate(blockW + width / 5, height / 2)
      pg2.rect(0, 0, width / 10, height)
      pg2.pop()

    } else if (yatayChooser == 1.0) {
      pg2.push()
      pg2.translate(width / 2, blockH)
      pg2.rect(0, 0, width, height / 10)
      pg2.pop()

      pg2.push()
      pg2.translate(width / 2, blockH - height / 5)
      pg2.rect(0, 0, width, height / 10)
      pg2.pop()

      pg2.push()
      pg2.translate(width / 2, blockH + height / 5)
      pg2.rect(0, 0, width, height / 10)
      pg2.pop()
    }
    pg2.pop()
  }

  c.image(img, w / 2, h / 2)
  img.image(c, w / 2, h / 2)

  if (frameCount % frameMod == 0) {
    // ----------------------------
    // Existing code for shapes:
    // ----------------------------
    minDim = min(width, height)

    sChooser = random([1.0, 2.0, 3.0])
    ellipseChooser = random([0.0, 0.0, 1.0, 0.0])

    if (frameMod == 25) {
      akChooser = random([1, 2])
    } else {
      akChooser = random([1, 2, 3, 4, 1, 2])
    }

    dirChooser = random([1.0, 2.0, 3.0])
    border = random([0.0, 0.0, 1.0, 0.0, 0.0])
    yatayChooser = random([0.0, 1.0])
    lineDir = random([0.0, 1.0])

    if (sChooser == 1.0) {
      s = random([minDim / 10, minDim / 5, minDim / 20, minDim / 10, minDim / 50])
    } else if (sChooser == 2.0) {
      s = random([minDim / 50, minDim / 20, minDim / 50, minDim / 20])
    } else if (sChooser == 3.0) {
      s = random([minDim / 10, minDim / 5, minDim / 10, minDim / 5])
    }

    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        pg2.fill(random([0, 255, 127]), random([0, 255, 127]), random([0, 255, 127]))
        if (ellipseChooser == 0.0) {
          pg2.rect(x, y, s, s)
        } else {
          pg2.ellipse(x, y, s, s)
        }
      }
    }

    if (akChooser == 1.0) {
      sh.setUniform('ak', random([1., 1., 2.0, 1., 1., 2.0, 3., 1., 1., 1.]))
    } else if (akChooser == 2.0) {
      sh.setUniform('ak', 3.0)
    } else if (akChooser == 3.0) {
      sh.setUniform('ak', 5.0)
    } else if (akChooser == 4.0) {
      sh.setUniform('ak', 10.0)
    }

    let dX = random([1., -1., 0.0, 0.0])
    let dY
    if (dX == 1. || dX == -1) {
      dY = 0.0
    } else {
      dY = random([-1, 1])
    }
    if (dirChooser == 1.0) {
      sh.setUniform('dirX', dX)
      sh.setUniform('dirY', dY)
    } else if (dirChooser == 2.0) {
      sh.setUniform('dirX', random([-1., 1.]))
      sh.setUniform('dirY', random([-1., 1.]))
    } else if (dirChooser == 3.0) {
      sh.setUniform('dirX', random([-1., 1., 0., 0., 0.]))
      sh.setUniform('dirY', random([-1., 1., 0., 0., 0.]))
    }
    sh.setUniform('u_lineDir', lineDir)

    blockColor = random([255, 127])
    blockColor2 = random([255, 127])
    blockColor3 = random([255, 127])

    blockW = random([width / 2, width / 4, width / 1.3333])
    blockH = random([height / 2, height / 4, height / 1.3333])

    // ----------------------------
    // NEW: Trigger the Audio Here
    // ----------------------------


    notes = ["D5", "F5", "A5", "D6"];
    randomNote = random(notes);

    // if (Tone.context.state == "running") {
    //   synthOsc.triggerAttackRelease(randomNote, "32n");
    // }

    aksak = random([16, 16, 16, 24, 24, 24, 24, 12, 8, 16, 16, 16])

    // s = random([minDim / 10, minDim / 5, minDim / 20, minDim / 10, minDim / 50])

    if (s == minDim / 50) {
      kickEnv.decay = 0.01
      snareOsc.envelope.attack = 0.001
      snareOsc.envelope.decay = 0.001
      envMult = 5
      percEnv.attack = 0.00005
      percEnv.decay = 0.00002
      percOsc.volume.value = 5;
      noiseOsc.volume.value = -18;
      snareOsc.volume.value = 5;
      randomNote = "A5"
    } else if (s == minDim / 20) {
      kickEnv.decay = 0.1
      snareOsc.envelope.attack = 0.005
      snareOsc.envelope.decay = 0.01
      envMult = 2
      percEnv.attack = 0.00005
      percEnv.decay = 0.00002
      percOsc.volume.value = 5;
      noiseOsc.volume.value = -20;
      snareOsc.volume.value = -3;
      randomNote = "D5"
    } else if (s == minDim / 10) {
      kickEnv.decay = 0.2
      snareOsc.envelope.attack = 0.01
      snareOsc.envelope.decay = 0.1
      envMult = 1
      percEnv.attack = 0.0005
      percEnv.decay = 0.0002
      percOsc.volume.value = -3;
      noiseOsc.volume.value = -22;
      snareOsc.volume.value = -9;
      randomNote = "A4"
    } else if (s == minDim / 5) {
      kickEnv.decay = 0.2
      snareOsc.envelope.attack = 0.01
      snareOsc.envelope.decay = 0.1
      envMult = 1
      percEnv.attack = 0.0005
      percEnv.decay = 0.0002
      percOsc.volume.value = -3;
      noiseOsc.volume.value = -22;
      snareOsc.volume.value = -9;
      randomNote = "D4"
    }


    if (dirChooser == 1.0) {
      aksak = random([12, 8, 16, 16])
      synthFilter.frequency = "16n"
    } else if (dirChooser == 2.0) {
      aksak = random([16, 16, 16, 12, 16, 16, 12])
      synthFilter.frequency = "12n"
    } else if (dirChooser == 3.0) {
      aksak = random([16, 16, 16, 24, 24, 24, 24])
      synthFilter.frequency = "8n"
    }


    aksakNoise = random([4, 4, 4, 4, 4, 4, 4])

    aksak2 = random([32, 16, 32, 16, 24, 24, 12, 12, 16, 32, 32, 32])

  }

  sh.setUniform('u_time', frameCount / 10.0)
  sh.setUniform('pg', pg2)
  sh.setUniform('img', img)
  sh.setUniform('pg2', pg2)

  quad(-1, -1, 1, -1, 1, 1, -1, 1)

  // frameAnalysis()

  if (Tone.context.state == "running") {

    if (frameCount % aksak == 0) {
      kickEnv.triggerAttackRelease("8n");
    }

    if (frameCount % aksak2 == 0) {
      if (random() < 0.9) {
        snareOsc.triggerAttackRelease("8n");
        snareFilter.frequency.value = random(500, 800) * 4
      }
    }


    if (frameCount % 4 == 0) {
      if (random() < 0.6) {
        percEnv.triggerAttackRelease("32n");
        percFilter.frequency.value = random(1000, 5000)
      }
    }



    if (frameCount % aksakNoise == 0) {
      if (random() < 0.6) {
        noiseOsc.triggerAttackRelease("32n");
        noiseOsc.envelope.decay = random([0.1, 0.1, 0.1, 0.9, 0.45, 0.1]) / envMult
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

function mousePressed() {
  clickCount++;

  if (clickCount === 1) {
    // 1) Start audio context if not running
    if (Tone.context.state !== "running") {
      Tone.start().then(() => {
        console.log("Audio context started!");
      });
    }

    // 2) Hide the HTML overlay
    let overlay = document.getElementById("overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  } 
  else if (clickCount === 2) {
    // 3) Open the external website in a new tab
    window.open("https://distcs.xyz", "_blank");
  }

  // If you have other logic in your existing mousePressed,
  // you can keep it here or integrate it as needed.
}

function keyPressed() {
  if (key == ' ') {
    stopCount += 1
    if (stopCount % 2 == 0) {
      frameRate(0)
    } else {
      frameRate(far)
    }
  }
  if (key == "s") {
    saveCanvas("strained", "png")
  }
}


function introCanvas() {
  f.push();
  f.rectMode(CENTER)
  f.fill(0, 0, 50);
  f.rect(w / 2, h / 2, w * 2, h * 2)


  f.push();
  f.rectMode(CENTER)
  f.fill(0, 0, 50);
  f.rect(w / 2, h / 2, w * 2, h * 2)
  minDim = min(width, height)
  f.push();
  translate(-width / 2, -height / 2)
  let si = minDim / 20
  for (let x = 0; x <= width; x += si) {
    if (random() < 0.8) noStroke()
    for (let y = 0; y <= height; y += si) {
      // si = random([minDim / 50,minDim / 25,minDim / 100])
      // if(random() < 0.9) stroke(0,0,0)
      f.fill(0, 0, random(30, 65))
      f.rect(x, y, si - x, si - x)


      // if (random() < 0.4) f.rect(x + si/2, y, si/2, si/2)
      // if (random() < 0.4) f.rect(x - si/2, y, si/2, si/2)
      // if (random() < 0.4) f.rect(x, y - si/2, si/2, si/2)
      // if (random() < 0.4) f.rect(x, y + si/2, si/2, si/2)

    }
  }
  f.pop();


  f.pop();
}


function audioSetup() {

  /************************************/
  /*  TONE.JS AUDIO SETUP (NEW)       */
  /************************************/
  // We create the instruments here but do NOT call Tone.start() yet.
  // That will happen in mousePressed().
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
  // kickEnv.toDestination();

  snareOsc = new Tone.NoiseSynth({
    noise: {
      type: "white", // Type of noise: "white", "pink", or "brown"
    },
    envelope: {
      attack: 0.005, // Time to reach maximum amplitude
      decay: 0.01, // Time to fall to sustain level
      sustain: 0.0, // Sustain amplitude level
      release: 1.0, // Time to fall to zero after release
    },
  })

  snareFilter = new Tone.Filter({
    frequency: 1500,
    type: "bandpass",
    rolloff: -12,
    Q: 1
  });
  snareOsc.volume.value = -9;
  snareOsc.connect(snareFilter);
  // snareFilter.toDestination();



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
  // percEnv.toDestination();



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
  // percEnv2.toDestination();

  noiseOsc = new Tone.NoiseSynth({
    noise: {
      type: "white", // Type of noise: "white", "pink", or "brown"
    },
    envelope: {
      attack: 0.0005, // Time to reach maximum amplitude
      decay: 0.1, // Time to fall to sustain level
      sustain: 0.0, // Sustain amplitude level
      release: 1.0, // Time to fall to zero after release
    },
  })

  noiseOscFilter = new Tone.Filter({
    frequency: 15000,
    type: "lowpass",
    rolloff: -12,
    Q: 1
  });
  noiseOsc.volume.value = -22;
  noiseOsc.connect(noiseOscFilter);
  // noiseOscFilter.toDestination();




  synthOsc = new Tone.DuoSynth({
    voice0: {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.005, // Time for amplitude to rise to maximum level
        decay: 0.0005, // Time for amplitude to fall to sustain level
        sustain: 0.0, // Sustain level (0-1)
        release: 1.5, // Time for amplitude to fall to 0 after note off
      },
    },
    voice1: {
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.001, // Faster attack for this voice
        decay: 0.001,
        sustain: 0.0,
        release: 1.0,
      },
    },
  });


  synthFilter = new Tone.AutoFilter({
    frequency: "8n", // LFO frequency in Hz (1 cycle per second)
    depth: 1.0, // How much the filter frequency is modulated
    baseFrequency: 100, // Starting frequency of the filter
    octaves: 4, // Modulation range in octaves
    filter: {
      type: "lowpass",
      rolloff: -24, // Steeper rolloff for better clarity
      Q: 1, // Resonance of the filter
    },
  }).start()
  synthOsc.volume.value = -18;

  synthFilter.type = "sine";

  pitchShifter = new Tone.PitchShift({
    pitch: 24, // Shift pitch up by 4 semitones
    windowSize: 0.5, // Size of the pitch-shifting window
    delayTime: 0.01, // Delay before processing (short for real-time shifting)
    feedback: 0.01, // Amount of feedback (for subtle effects)
  });

  synthOsc.connect(synthFilter)
  // synthFilter.toDestination()

  // pitchShifter.connect(synthFilter)


  // // Add a Reverb
  const reverb = new Tone.Reverb({
    decay: 2, // Decay time in seconds
    preDelay: 0.01, // Pre-delay in seconds
    wet: 0.5, // Wet/dry mix
  });

  // synthOsc.connect(reverb);

  synthFilter.connect(reverb)
  // synthFilter.toDestination()
  reverb.toDestination()


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
  snareFilter.connect(masterGain); // Snare's final filter
  percEnv.connect(masterGain); // Percussion 1
  percEnv2.connect(masterGain); // Percussion 2
  noiseOscFilter.connect(masterGain); // Noise Synth's final filter
  synthFilter.connect(masterGain); // Synth's final filter

}

function frameAnalysis() {

  finalFrame.push();
  finalFrame.clear();

  finalFrame.drawingContext.drawImage(
    c.elt, // source: our main canvas
    0, 0, width, height // destination coords & size
  );
  finalFrame.pop();


  analysisPG.push();
  analysisPG.clear();
  analysisPG.shader(flickerSh);

  flickerSh.setUniform('u_currentFrame', finalFrame);
  flickerSh.setUniform('u_prevFrame', prevFrame);
  flickerSh.setUniform('u_resolution', [width, height]);


  analysisPG.quad(-1, -1, 1, -1, 1, 1, -1, 1);
  analysisPG.pop();

  analysisPG.loadPixels(); // [r,g,b,a] in analysisPG.pixels
  let r = analysisPG.pixels[0]; // 0..255
  if (r > 80) {
    // It's white => big difference => flicker
    console.log("Flicker detected!");
    flick = true
    if (Tone.context.state == "running") {
      if (frameCount % 2 == 0) {
        if (random() < 0.9) {
          percEnv2.triggerAttackRelease("64n");
        }
      }
    }
  } else {
    flick = false
  }

  // 2) Use brightnessSh in brightnessPG
  brightnessPG.push();
  brightnessPG.clear();
  brightnessPG.shader(brightnessSh);

  // Pass the finalFrame as "u_frame"
  brightnessSh.setUniform('u_frame', finalFrame);
  brightnessSh.setUniform('u_resolution', [width, height]);

  brightnessPG.quad(-1, -1, 1, -1, 1, 1, -1, 1);
  brightnessPG.pop();

  // 3) Read the 32×32 brightness
  brightnessPG.loadPixels();
  let pix = brightnessPG.pixels;
  let sumBright = 0;
  let numPixels = 32 * 32; // same as brightnessPG.width*brightnessPG.height

  for (let i = 0; i < pix.length; i += 4) {
    let val = pix[i]; // 0..255
    sumBright += val;
  }
  let avgBright = sumBright / numPixels; // in 0..255

  if (avgBright > 190) {
    console.log("Mostly White Canvas");
    if (currentFilter !== highpf) {
      // Switch to HPF
      if (Tone.context.state == "running") {
        masterGain.disconnect();
        masterGain.connect(highpf);
        currentFilter = highpf;
      }
    }
  } else if (avgBright < 30) {
    console.log("Mostly Black Canvas");
    if (currentFilter !== lowpf) {
      // Switch to LPF
      if (Tone.context.state == "running") {
        masterGain.disconnect();
        masterGain.connect(lowpf);
        currentFilter = lowpf;
      }
    }
  } else {
    if (currentFilter !== null) {
      // Remove any filtering
      if (Tone.context.state == "running") {
        masterGain.disconnect();
        masterGain.toDestination();
        currentFilter = null;
      }
    }
  }

  // 5) Update prevFrame (which is 2D) with the main canvas
  prevFrame.push();
  prevFrame.image(c, 0, 0, width, height);
  prevFrame.pop();

}

function initSetup() {

  minDim = min(width, height)

  sChooser = random([1.0, 2.0, 3.0, 1.0]) ///////////////rectangle sizes
  if (sChooser == 1.0) {
    s = minDim / 10
  } else if (sChooser == 2.0) {
    s = minDim / 50
  } else if (sChooser == 3.0) {
    s = minDim / 20
  }

  ellipseChooser = random([0.0, 0.0, 1.0, 0.0, 0.0]) /////ellipse 
  ellipseChooser = 0

  if (frameMod == 25) {
    akChooser = random([1, 2])
  } else {
    akChooser = random([1, 2, 3, 4, 1, 2])
  }

  dirChooser = random([1.0, 2.0, 3.0, 3.0]) ///direction chooser

  let dX = random([1., -1., 0.0, 0.0])
  let dY
  if (dX == 1. || dX == -1) {
    dY = 0.0
  } else {
    dY = random([-1, 1])
  }

  let proD = random([.1, .5])
  lineDir = random([0.0, 1.0])

  shader(sh)
  sh.setUniform('resolution', [w * pix, h * pix])
  sh.setUniform('pg', pg2)
  sh.setUniform('pg2', pg2)
  sh.setUniform('img', f)
  sh.setUniform('proD', proD)
  sh.setUniform('u_lineDir', lineDir)

  if (dirChooser == 1.0) {
    sh.setUniform('dirX', dX) ///sadece dikeyYatay
    sh.setUniform('dirY', dY)
  } else if (dirChooser == 2.0) {
    sh.setUniform('dirX', random([-1., 1.])) ///sadece kose
    sh.setUniform('dirY', random([-1., 1.]))
  } else if (dirChooser == 3.0) {
    sh.setUniform('dirX', random([-1., 1., 0., 0., 0.])) ////hepsi
    sh.setUniform('dirY', random([-1., 1., 0., 0., 0.]))
  }

  if (akChooser == 1.0) {
    sh.setUniform('ak', 1.)
  } else if (akChooser == 2.0) {
    sh.setUniform('ak', 3.0)
  } else if (akChooser == 3.0) {
    sh.setUniform('ak', 5.0)
  } else if (akChooser == 4.0) {
    sh.setUniform('ak', 10.0)
  }

  sh.setUniform('satOn', dirChooser)

  img.image(f, w / 2, h / 2)

  blockColor = 255
  blockColor2 = 255
  blockColor3 = 255

  blockW = width / 2
  blockH = height / 2
  blockAni = random([0.0, 1.0])

  border = random([0.0, 0.0, 1.0, 1.0, 0.0])
  if (border == 1.0) borderStr = "border"
  yatayChooser = random([0.0, 1.0])
}