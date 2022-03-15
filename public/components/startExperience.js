AFRAME.registerComponent('startexperience', {
  dependencies: ['resonanceSystem', 'heartratemonitor', 'pairDevice', 'timeline'],
  init: function () {
    document.querySelector("#startX").style.display = "flex";
    let sceneEl = this.el;
   

    document.querySelector("#start").onclick = () => {
      document.querySelector("#startX").style.display = "none";
       console.log("Starting simulation");
      sceneEl.components.resonancesystem.run();
      sceneEl.components.timeline.run();  //TODO MAKE BETTER
    }

    //TODO first pair the device and then start the experience   
    document.querySelector("#pairing").onclick = () => {
      //document.querySelector("#startX").style.display = "none";
       console.log("Pairing the device");
      //sceneEl.components.heartratemonitor.run();
      sceneEl.components.pairdevice.run();
    } 
  }
});