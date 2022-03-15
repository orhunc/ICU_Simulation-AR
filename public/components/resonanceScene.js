//A System to handle Resonance Audio
AFRAME.registerComponent('resonancesystem', {
  init: function () {
    // Set up the tick throttling
    this.tick = AFRAME.utils.throttleTick(this.tick, 50, this);

    // List of Sources handles by resonance //TODO
    this.sources = [];

    // Audio scene globals
    this.audioContext = new (window.AudioContext || window.webkitAudioContext);
    this.resonanceAudioScene = new ResonanceAudio(this.audioContext, { ambisonicOrder: 3 });
    // Connect the scene’s binaural output to stereNodeo out.
    this.resonanceAudioScene.output.connect(this.audioContext.destination);

    //Source Handling
    let sourceEls = document.querySelectorAll('[resonancesource]');
    //register all source components
    let self = this;
    sourceEls.forEach(function (e) {
      self.registerMe(e.components.resonancesource)
    });
    
    this.audioContext.suspend();

    // Set up a 80m², 4 bed ICU
    // NEEDS TO BE MIRRORED IN index.html for correct representation
    let roomDimensions = {
      width : 10,
      height : 3,
      depth : 8
    };
    // Simplified view of the materials that make up the scene
    let roomMaterials = {
      left : 'plaster-smooth', // WALLS
      right : 'glass-thick', // windows on one side
      front : 'plaster-smooth',
      back : 'plaster-smooth',
      down : 'linoleum-on-concrete', // floor
      up : 'acoustic-ceiling-tiles' // a hospital should have those
    };
    this.resonanceAudioScene.setRoomProperties(roomDimensions, roomMaterials);
  },

  /**
   * Tick function that will be wrapped to be throttled.
   */
  tick: function (t, dt) {
    const cameraEl = this.el.camera.el;
    this.resonanceAudioScene.setListenerFromMatrix(cameraEl.object3D.matrixWorld);
  },

  registerMe: function (el) {
    //create and finish init of audio source
    console.log("Registering audio source: ");
    console.log(el);
    el.system = this;
    el.resonanceAudioScene = this.resonanceAudioScene;
    el.audioContext = this.audioContext;
    el.audioElementSource = el.audioContext.createMediaElementSource(el.sourceNode);
    el.sceneSource = el.resonanceAudioScene.createSource();
    el.sceneSource.setGain(el.data.gain);
    el.sceneSource.setSourceWidth(el.data.width);
    el.audioElementSource.connect(el.sceneSource.input);

    this.sources.push(el);
  },

  unregisterMe: function (el) {
    var index = this.sources.indexOf(el);
    this.sources.splice(index, 1);
    //TODO add logic to un-register source?
  },

  /**
   * Circumvent browser autoplay block
   */
  run: function () {
    this.audioContext.resume();
    this.sources.forEach(function (s) {
      if (s.data.autoplay) {
        s.sourceNode.play();
      }
    });
  }, 
  
  stop: function () {
    this.sources.forEach(function (s) {
      s.sourceNode.pause();
    });
    this.audioContext.suspend();
  }
});

AFRAME.registerComponent('resonancesource', {
  dependencies: ['geometry', 'position'],
  schema: {
    src: { type: 'string', default: '' },
    loop: { type: 'boolean', default: false },
    autoplay: { type: 'boolean', default: false },
    gain: { type: 'number', default: 1 },
    width: {type: 'number', default: 0},
    starttime:  {type: 'number', default: 0},
    stoptime: {type: 'number', default: Infinity}
  },
  init: function () {
    this.pos = new AFRAME.THREE.Vector3();
    this.system = undefined;
    this.resonanceAudioScene = undefined;
    this.audioContext = undefined;
    this.audioElementSource = undefined;
    this.sceneSource = undefined;

    //tick throttle for performance
    this.tick = AFRAME.utils.throttleTick(this.tick, 50, this);

    //get audio source from aframe asset management with #id
    this.sourceNode = document.querySelector(this.data.src);
    //set looping
    if (this.data.loop) {
      this.sourceNode.setAttribute('loop', 'true');
    } else {
      this.sourceNode.removeAttribute('loop');
    }
  },

  tick: function (t, td) {
    //TODO performance?
    this.setSoundPos();
  },

  setSoundPos: function () {
    if (this.sceneSource) {
      this.sceneSource.setFromMatrix(this.el.object3D.matrixWorld);
    }
  }
});

AFRAME.registerComponent('raycasterlisten', {
	init: function () {
    this.timer = null;
    this.patient = null;
    // Use events to figure out what raycaster is listening so we don't have to
    // hardcode the raycaster.
    this.el.addEventListener('raycaster-intersected', evt => {
      this.raycaster = evt.detail.el;
    });
    this.el.addEventListener('raycaster-intersected-cleared', evt => {
      this.raycaster = null;
    });
  },

  tick: function () {
    // Not intersecting.
    if (!this.raycaster) {
      if(!this.timer) {
        return;
      } else {
        if (this.patient.hasProblem){
          this.el.setAttribute('material', {color: 'red'});
        }
        clearTimeout(this.timer);
        this.timer = null;
        this.patient = null;
        return;
      }
    }  
    if (!this.patient) {
      console.log(this.el.components.patient);
      console.log(this.el.components);
      if(this.el.components.patient){
        this.patient = this.el.components.patient;
      }
    }
    if (!this.timer) {
      if (this.patient.hasProblem){
          this.el.setAttribute('material', {color: 'orange'});
          this.timer = setTimeout(() => {
            this.patient.endProblem(); 
            this.timer = null;
          }, this.patient.currentProblemTreatmentTime);
      }
    }
  }
});

/**
 * A Patient Component
 * meant to be used on entity in scene
 * creates it's own resonance sound entities and adds them to the scene
 */
AFRAME.registerComponent('patient', {
  schema: {
    id: {type: 'string'},
    ekg: { type: 'boolean', default: true },
    hr: {type: 'number', default: 60},
    ivpump: { type: 'boolean', default: false },
    ventilator: { type: 'boolean', default: false },  //[#id, duration (ms)]
    /* this was way too fancy... but we need to control is elsewhere
    sounds: {
      default: new Map(),
      parse: function (value) {
        let array2d = value.split('/').map(function(s) {
          return s.split(",");
        });
        return new Map(array2d);
      },
      stringify: function (value) {
        return value.join('/'); //TODO not working, still standard
      }
    },*/
    sounds: {type: 'array', default: []}
  },

  init: function () {
    console.log("Adding patient");
    console.log("With sounds:")
    console.log(this.data.sounds)

    // Set up the tick throttling
    /* this was way too fancy... but we need to control is elsewhere
    this.tick = AFRAME.utils.throttleTick(this.tick, 100, this);
    */

    //Variables
    this.alive = false;
    this.hasProblem = false;
    this.currentProblemTreatmentTime = 1000;
    this.currentProblemDuration = Infinity;
    this.currentProblemTerminal = false;
    this.currentProblemSound = undefined;

    this.sounds = new Map(); //list of {name, starttime, sourceNode}
    //this.nextSoundId = 0;

    //---- Appearance ----
    this.el.setAttribute('geometry',{primitive: 'cylinder', segmentsRadial: 6, radius: 0.8, height: 2.6});
    this.el.setAttribute('material',{color: 'green', opacity: 0.8});

    //---- EKG ----
    console.log("HR: " + this.data.hr);
    this.ekgpause = (60 / this.data.hr) -0.62; //in seconds
    console.log("pause between ekg beeps: " + this.ekgpause);

    console.log('#ekgBeep'+this.data.id);
    if (this.data.ekg){
      this.el.setAttribute('resonancesource', {
        src: '#ekgBeep'+this.data.id,
        loop: false ,
        autoplay: false,
        gain: 0.04
      });
      this.ekgSound = this.el.components.resonancesource.sourceNode;
      console.log(this.ekgSound)
     

      //custom looping for variable HR
      this.ekgSound.onended =(event) => {
        event.target.currentTime = 2.0 - this.ekgpause; //the actual file is 2 s of silence + 0.62 of beep long
        event.target.play();
      };
    }

    //---- IV ----
    if (this.data.ivpump){
      //create new entity for IV sound
      let el = document.createElement('a-entity');
      el.setAttribute('resonancesource', {
        src: '#IVpump'+this.data.id,
        loop: true,
        autoplay: false,
        gain: 0.8
      });
      el.setAttribute('geometry',{primitive: 'octahedron', radius: 0.3});
      this.el.appendChild(el);
      this.ivSound = document.querySelector('#IVpump'+this.data.id);
    }

    //---- ventilator ----
    //TODO
    if (this.data.ventilator) {
      //create new entity for ventilator sound
      let el = document.createElement('a-entity');
      el.setAttribute('resonancesource', {
        src: '#ventilator'+this.data.id,
        loop: true,
        autoplay: false,
        gain: 0.8
      });
      el.setAttribute('geometry',{primitive: 'triangle', radius: 0.3});
      this.el.appendChild(el);
      this.ventilatorSound = document.querySelector('#ventilator'+this.data.id);
    }


    //---- creating all sound entities beforhand ----
    for (sound of this.data.sounds) {
      console.log("Creating patient sound: " + sound);
      //create new entity sound
      let el = document.createElement('a-entity')
      el.setAttribute('resonancesource', {
        src: sound,
        loop: false, //TODO check if customizable
        autoplay: false,
        gain: 1
      })
      el.setAttribute('geometry',{primitive: 'box', width: 0.5, height: 0.5, depth: 0.5});
      //append to scene
      this.el.appendChild(el);

      //add to array
      this.sounds.set(sound, el);
    }
    console.log(this.sounds);
  },

  /**
   * Let the patient have a problem with accompaining sounds and durations and severity (terminal)
   */
  haveProblem: function(problemName, sound, loop = false, treatmenttime, duration = Inifity , terminal = false) {
    if (this.alive){
      this.endProblem(false);
      console.log("Patient " + this.data.id + " is having a problem: " + problemName + ", with sound: " + sound);
      this.el.sceneEl.components.timeline.timestamps.set(problemName, performance.now());

      //emit event
      this.el.emit('havingproblem');  //TODO needs to bubble?

      //play sound of problem
      if(sound != ""){
        this.currentProblemSound = this.sounds.get(sound).components.resonancesource.sourceNode;
        if (loop) {
        this.currentProblemSound.setAttribute('loop', 'true');
      } else {
        this.currentProblemSound.removeAttribute('loop');
      }
        this.currentProblemSound.play();
      }

      this.currentProblemName = problemName;
      this.currentProblemTreatmentTime = treatmenttime;
      this.currentProblemDuration = duration;
      this.currentProblemTerminal = terminal;
      this.hasProblem = true;
      
      //make red
      this.el.setAttribute('material', {color: 'red'});

      //countdown timer
      if (duration != Infinity){
        setTimeout(() => {
          this.endProblem(false);
        }, this.currentProblemDuration);
      }
    }
  },

  //TODO audio feedback
  endProblem: function(successful = true) {
    if (this.hasProblem) {
      this.hasProblem = false;
      this.currentProblemSound.pause(); // stop sound
      this.currentProblemSound.currentTime = 0; // reset sound to beginning
      
      if(successful){
        this.el.setAttribute('material', {color: 'green'});
        this.el.sceneEl.components.timeline.timestamps.set(this.currentProblemName + " - solved succesfull", performance.now());
        //emit event
        this.el.emit('problemresolvedsuccessful');
      } else if (!this.currentProblemTerminal) {
        this.el.setAttribute('material', {color: 'green'});
        this.el.sceneEl.components.timeline.timestamps.set(this.currentProblemName + " - solved unsuccessfull", performance.now());
      } else {
        this.el.setAttribute('material', {color: 'black'});
        this.el.sceneEl.components.timeline.timestamps.set(this.currentProblemName + " - solved patient died", performance.now());
        this.alive = false;
      }
    }
    console.log(this.el.sceneEl.components.timeline.timestamps.entries());
  },

  spawn: function() {
    //make visible
    this.el.object3D.visible = true

    //start sounds
    if (this.data.ekg) {this.ekgSound.play()}
    if (this.data.ivpump)  {this.ivSound.play()}
    if (this.data.ventilator)  {this.ventilatorSound.play()}

    //be alive
    this.alive = true
  },

  remove: function() {
    //make invisible
    this.el.object3D.visible = false

    //stop all sounds
    if (this.data.ekg) {this.ekgSound.pause()}
    if (this.data.ivpump)  {this.ivSound.pause()}
    if (this.data.ventilator)  {this.ventilatorSound.pause()}
    
    for (s of this.sounds.values()) {
      console.log(s)
      s.components.resonancesource.sourceNode.pause()
    }
  },

  /* this was way too fancy... but we need to control is elsewhere
  tick: function(t, td) {
    //play sounds at specified time
    if (this.nextSoundId < this.sounds.length && performance.now() - this.el.sceneEl.components.timeline.timestamps.get("scene_start") > this.sounds[this.nextSoundId].starttime)
    {
      console.log("Playing sound " + this.sounds[this.nextSoundId].name + " at " + this.sounds[this.nextSoundId].starttime + " |Current time: " + performance.now());
      this.sounds[this.nextSoundId].element.components.resonancesource.sourceNode.play();
      
      this.nextSoundId++;
    }
  }*/
  
});

AFRAME.registerComponent('telephone', {
  init: function () {
    this.clickhandler = this.clicked.bind(this);
    this.el.addEventListener('click', this.clickhandler);

    this.hello = document.createElement('a-entity');
    this.hello.setAttribute('resonancesource', {
      src: '#hello_lowQ',
      loop: false,
      autoplay: false,
      gain: 0.8
    });
    this.hello.setAttribute('material',{opacity: 0});
    this.el.appendChild(this.hello);
  },
  
  clicked: function (evt) {
    console.log("clicked telephone");
    let s = this.el.components.resonancesource.sourceNode;
    s.pause();  //pause ringing sound
    s.currentTime = 0; //set ringing sound to 0
    this.hello.components.resonancesource.sourceNode.play();
  },
});

AFRAME.registerComponent('narrator', {
  init: function () {
    this.tutorialsound;
    this.treatmentstartsounds = [];
    this.treatmentcompletesounds = [];

    //event handling
    let onproblemresolvedsuccessful = this.onproblemresolvedsuccessful.bind(this);
    document.addEventListener('problemresolvedsuccessful', onproblemresolvedsuccessful);

    //---- Appearance ----
    this.el.setAttribute('geometry',{primitive: 'dodecahedron', radius: 0.1});
    this.el.setAttribute('material',{color: 'blue', opacity: 0.8});
    this.el.setAttribute('animation',{property: 'object3D.rotation.y', easing: 'linear', dur: 15000, from: 0, to: 360, loop: true});

    this.goodworkEl = document.createElement('a-entity');
    this.goodworkEl.setAttribute('resonancesource', {
        src: '#goodwork',
        loop: false ,
        autoplay: false,
        gain: 1
    });
    this.goodworkEl.object3D.visible = false;
    this.el.appendChild(this.goodworkEl);
  },
  
  onproblemresolvedsuccessful: function(event){
      this.goodworkEl.components.resonancesource.sourceNode.play();
  }

});