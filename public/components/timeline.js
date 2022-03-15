AFRAME.registerComponent('serverlogger', {
  init: function() {
  
  },

  sendLog: function (contentString) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "https://VagueInfatuatedGraph.kxv.repl.co", true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    console.log("Sending log: ");
    console.log(contentString);
    xhr.send(contentString);
  }
});

/** 
* Timeline function that controls the whole experience from start to end 
* and at the same time provides a place to get timestamps
*/
AFRAME.registerComponent('timeline', {
  init: function() {
    this.timestamps = new Map();
    this.timestamps.set("starttime", performance.now())

    this.timeouts = [];

    this.tut_container = document.querySelector("#tutorialcontainer")
    this.anchor_container = document.querySelector("#anchoringcontainer")
    this.main_container = document.querySelector("#mainscenecontainer")
    
    //find all patients to have access later
    this.patients = new Map();
    let patientlist = document.querySelectorAll('[patient]');
    for (p of patientlist) {
      this.patients.set(parseInt(p.components.patient.data.id), p);
    }

    console.log(this.patients)
  },

  clearAllTimeouts: function() {
    for (t of this.timeouts) {
      clearTimeout(t);
    }
    timeouts = []
  },

  startTutorial: function() {
    //log time
    this.timestamps.set("tutorial_start", performance.now())
    //make all things tutorial visible
    this.tut_container.object3D.visible = true;

    let t_patient = document.querySelector("#t_patient")
    let tutorialSound = document.querySelector("#s_tutorial").components.resonancesource.sourceNode

    //make skippable
    document.addEventListener('keyup', event => {
      if (event.code === 'KeyN' && tutorialSound) {
        tutorialSound.pause();
        this.endTutorial();
        this.startAnchoring();
      }
    }, {once: true})
    

    this.timeouts.push(setTimeout(() => {
      tutorialSound.play();
    }, 2000));
    

    //make patient appear
    this.timeouts.push(setTimeout(() => {
      t_patient.components.patient.spawn()
    }, 20500));
    //patient has problem
    this.timeouts.push(setTimeout(() => {
      //pause IV sound, as it's part of the problem sound
      t_patient.components.patient.ivSound.pause()
      t_patient.components.patient.haveProblem("Tutorial_problem", "#t_IValarm2", true, 10000, Infinity, false)
    }, 21000));

    //wait for user to treat patient
    this.timeouts.push(setTimeout(() => {
      tutorialSound.pause();
      document.addEventListener('problemresolvedsuccessful', event => {
        //play IVpump again
        event.target.components.patient.ivSound.play();
        //continue tutorial
        tutorialSound.currentTime = 36;
        this.timeouts.push(setTimeout(() => {
          tutorialSound.play();
          this.timeouts.push(setTimeout(() => {
            t_patient.remove();
          }, 4000));
        }, 1500));
      }, {once: true});
    }, 35000));    

    tutorialSound.onended = (event) => {
      this.endTutorial();
      this.startAnchoring();
    };
  },

  endTutorial: function() {
    //log time
    this.timestamps.set("tutorial_end", performance.now())

    //do not carry over any timeouts into next scene
    this.clearAllTimeouts();

    
    this.tut_container.object3D.visible = false;
  },

  startAnchoring: function() {
    //log time
    this.timestamps.set("anchoring_start", performance.now())

    this.anchor_container.object3D.visible = true;

    //make background middle gray
    this.el.sceneEl.setAttribute('background','color', '#777777');

    //create pink noise procedurally
    let context = this.el.sceneEl.components.resonancesystem.audioContext;
    let pinkNoise = context.createPinkNoise();
    let gainNode = context.createGain();
    pinkNoise.connect(gainNode);
    gainNode.connect(context.destination);
    gainNode.gain.setValueAtTime(0.11, context.currentTime);

     //make skippable
    document.addEventListener('keyup', event => {
      if (event.code === 'KeyN' && pinkNoise) {
        gainNode.disconnect();
        this.endAnchoring();
        this.startScene();
      }
    }, {once: true})

    //play pink noise for X seconds
    this.timeouts.push(setTimeout(() => {
      gainNode.disconnect();
      this.endAnchoring();
      this.startScene();
    }, 25000));

  },

  endAnchoring: function() {
    //log time
    this.timestamps.set("anchoring_end", performance.now())
    this.anchor_container.object3D.visible = false;
    this.el.sceneEl.setAttribute('background','color', 'white');
  },

  startScene: function() {
    //log time
    this.timestamps.set("scene_start", performance.now())

    //make all visible
    this.main_container.object3D.visible = true;

    //spawn patients
    this.patients.forEach((value, key) => {
      if (key != 99){
        console.log(value);
        value.components.patient.spawn();
      }
    })

    // -- start environment sounds -- //
    document.querySelector("#ceilingfan").components.resonancesource.sourceNode.play()
    

    //let patient 1 cough after 2 seconds, dont loop, stop after 1s
    //this.playPatientSound(1, "#coughing1", 2000, false, 1000);
    //let patient 1 beep wildly after 4 seconds, loop sound, stop after 3s
    //this.playPatientSound(1, "#ekgBeep3", 4000, true, 3000);

    //--- let patient 1 have a problem

    //patient 1 coughs, loop sound, 5000 s treatment time, no end, not terminal
    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 coughs";
      //unsuccesfully solve any problem that is still there
      this.patients.get(1).components.patient.haveProblem(problemName, "#coughing1", true, 5000, 8000, false);
    }, 2000));

    //--- let patient 1 have a problem
    //patient 1 coughs, loop sound, 5000 s treatment time, no end, not terminal
    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 coughs again";
      //unsuccesfully solve any problem that is still there
      this.patients.get(1).components.patient.haveProblem(problemName, "#coughing1", true, 5000, 10000, false);
    }, 15000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 2 coughs";
      //unsuccesfully solve any problem that is still there
      this.patients.get(2).components.patient.haveProblem(problemName, "#coughing2", true, 3000, 10000, false);
    }, 30000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 IV alarm";
      //unsuccesfully solve any problem that is still there
      this.patients.get(1).components.patient.haveProblem(problemName, "#IValarmB1", true, 2000, 10000, false);
    }, 42000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 coughs";
      this.patients.get(1).components.patient.haveProblem(problemName, "#coughing1", true, 2000, 10000, false);
    }, 50000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 2 coughs";
      this.patients.get(2).components.patient.haveProblem(problemName, "#coughing2", true, 8000, 15000, false);
    }, 60000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 coughs";
      this.patients.get(1).components.patient.haveProblem(problemName, "#coughing1", true, 3000, 10000, false);
    }, 72000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 coughs";
      this.patients.get(1).components.patient.haveProblem(problemName, "#coughing1", true, 6000, 15000, false);
    }, 78000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 2 coughs";
      this.patients.get(2).components.patient.haveProblem(problemName, "#coughing2", true, 8000, 10000, false);
    }, 83000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 coughs";
      this.patients.get(1).components.patient.haveProblem(problemName, "#coughing1", true, 5000, 20000, false);
    }, 100000));
    
    // ---- PATIENT 3 ----
    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 3 coughs";
      //unsuccesfully solve any problem that is still there
      this.patients.get(3).components.patient.haveProblem(problemName, "#coughing3", true, 4000, 15000, false);
      console.log('patient 3 coughs, loop sound, 5 s treatment time, 15s time, terminal');
    }, 55000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 4 coughs";
      //unsuccesfully solve any problem that is still there
      this.patients.get(4).components.patient.haveProblem(problemName, "#coughing4", true, 2000, 15000, false);
      console.log('patient 3 coughs, loop sound, 5 s treatment time, 15s time, terminal');
    }, 85000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 3 coughs";
      //unsuccesfully solve any problem that is still there
      this.patients.get(3).components.patient.haveProblem(problemName, "#coughing3", true, 2000, 15000, false);
      console.log('patient 3 coughs, loop sound, 5 s treatment time, 15s time, terminal');
    }, 90000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 4 IV alarm";
      //unsuccesfully solve any problem that is still there
      this.patients.get(4).components.patient.haveProblem(problemName, "#IValarmB4", true, 5000, 15000, false);
      console.log('patient 3 coughs, loop sound, 5 s treatment time, 15s time, terminal');
    }, 100000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 3 IV alarm";
      //unsuccesfully solve any problem that is still there
      this.patients.get(3).components.patient.haveProblem(problemName, "#IValarmB3", true, 8000, 20000, false);
    }, 120000));    

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 4 flatline could be terminal";
      //unsuccesfully solve any problem that is still there
      this.patients.get(4).components.patient.haveProblem(problemName, "#ekgFlatline4", false, 4000, 15000, true);
    }, 125000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 coughs";
      this.patients.get(1).components.patient.haveProblem(problemName, "#coughing1", true, 2000, 20000, false);
    }, 130000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 3 IV alarm";
      //unsuccesfully solve any problem that is still there
      this.patients.get(3).components.patient.haveProblem(problemName, "#IValarmB3", true, 5000, 20000, false);
    }, 135000));  

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 1 flatline could be terminal";
      //unsuccesfully solve any problem that is still there
      this.patients.get(1).components.patient.haveProblem(problemName, "#ekgFlatline1", true, 5000, 20000, true);
    }, 141000));  

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 3 IV alarm";
      //unsuccesfully solve any problem that is still there
      this.patients.get(3).components.patient.haveProblem(problemName, "#IValarmB3", true, 5000, 20000, false);
    }, 150000)); 


    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 2 coughs";
      this.patients.get(2).components.patient.haveProblem(problemName, "#coughing2", true, 6000, 20000, false);
    }, 149000));

    this.timeouts.push(setTimeout(() => {
      let problemName = "Patient 3 IV alarm";
      //unsuccesfully solve any problem that is still there
      this.patients.get(3).components.patient.haveProblem(problemName, "#coughing3", true, 3000, 20000, false);
    }, 158000));



    // ---- END OF MAIN SCENE TIMEOUT ----
    this.timeouts.push(setTimeout(() => {
      this.endScene();
    }, 170000));  //TODO set reasonable timeout

  },

  endScene: function() {
    //log time
    this.timestamps.set("scene_end", performance.now())

    console.log("Main Scene ended.")

    //stop all sounds
    this.el.components.resonancesystem.stop();

    //fade to black?

    //do not carry over any timeouts into next scene
    this.clearAllTimeouts();

    //send log
    let log = "";
    this.timestamps.forEach((value, key) => {
      log += value + "," + key + "\n";
    })
    log += this.el.sceneEl.components.pairdevice.getHRString();
    this.el.components.serverlogger.sendLog(log);
  },

  run: function() {
    //start tutorial after 2 seconds
    this.startTutorial();
  },

  /**
   * Play a sound of patiend at specific time, possible to loop
   * patientID: integer
   * sound: string with DOM key
   * startTime: int in milliseconds
   * loop: boolean, loop sound?
   * duration: int in milliseconds, for how long should the sound play
   */
  playPatientSound: function(patientID, sound, startTime, loop, duration = Infinity){
    let sourceNode = this.patients.get(patientID).components.patient.sounds.get(sound).components.resonancesource.sourceNode;

    if (loop) {
      sourceNode.setAttribute('loop', 'true');
    } else {
      sourceNode.removeAttribute('loop');
    }

    setTimeout(() => {
      sourceNode.play();
      this.patients.get(patientID).setAttribute('material', {color: 'red'});
      console.log('test_______________________________________________');
      console.log(this.patients.get(patientID).ac);
    }, startTime);

    if(duration < Infinity){
      setTimeout(() => {
      sourceNode.pause()
      this.patients.get(patientID).setAttribute('material', {color: 'green'});
    }, duration + startTime);
    }
  }

});