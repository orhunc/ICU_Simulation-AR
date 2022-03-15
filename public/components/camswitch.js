AFRAME.registerComponent('camswitch', {
  init: function () {
    //make spectator cam

    this.spectatorcamacitve = false;
    this.cams = document.querySelectorAll('[camera]');
    console.log(this.cams);
    
    document.addEventListener('keyup', event => {
      if (event.code === 'KeyC') {
        if(!this.spectatorcamacitve) {
          console.log('switch to cam 2');
          this.cams[0].setAttribute('camera', 'active', false);
          this.cams[1].setAttribute('camera', 'active', true);
        } else {
          console.log('switch to cam 1');
          this.cams[0].setAttribute('camera', 'active', true);
          this.cams[1].setAttribute('camera', 'active', false);
        }
        this.spectatorcamacitve = !this.spectatorcamacitve;
      }
    })
  }
});