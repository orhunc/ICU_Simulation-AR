AFRAME.registerComponent('pairdevice', {

  init: function() {
    //init data structure
    this.hrLog = new Map();
    this.hrData = new Array(200).fill(10)

    //graph
    let height = 100
    let width = 400
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = height
    canvas.width = width
    context.fillStyle = '#fff'
    window.console.graph = data => {
      const n = data.length
      const units = Math.floor(width / n)
      width = units * n
      context.clearRect(0, 0, width, height)
      for (let i = 0; i < n; ++i) {
        context.fillRect(i * units, 0, units, 100 - (data[i] / 2))
      }
      console.log('%c ',
        `font-size: 0; padding-left: ${width}px; padding-bottom: ${height}px;
        background: url("${canvas.toDataURL()}"), -webkit-linear-gradient(#eee, #888);`,
      )
    }
  },

  connect: async function(props) {
    const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['heart_rate'] }],
    acceptAllDevices: false,
    })

    console.log(`%c\n👩🏼‍⚕️`, 'font-size: 82px;', 'Starting HR...\n\n')
    const server = await device.gatt.connect()
    const service = await server.getPrimaryService('heart_rate')
    const char = await service.getCharacteristic('heart_rate_measurement')
    char.oncharacteristicvaluechanged = props.onChange
    char.startNotifications()
    return char
  },

  run: function(){
     this.printer = this.printHeartRate.bind(this);
     this.connect({ onChange: this.printer }).catch(console.error)
   },

  printHeartRate: function(event){
        const heartRate = event.target.value.getInt8(1)

        this.hrLog.set(performance.now(), heartRate); //current log heart rate

        const prev = this.hrData[this.hrData.length - 1]
        this.hrData[this.hrData.length] = heartRate
        this.hrData = this.hrData.slice(-200)
        let arrow = ''
        if (heartRate !== prev) arrow = heartRate > prev ? '⬆' : '⬇'
        console.graph(this.hrData)
        console.log(`%c\n💚 ${heartRate} ${arrow}`, 'font-size: 24px;', '\n\n(To disconnect, refresh or close tab)\n\n')
      }, 
   /**
   * return recorded HR data as string
   */
  getHRString: function () {
    let s = "";
    
    //---FAKEDATA---
    //this.hrLog.set(10000, 60);
    //this.hrLog.set(20000, 160);
    //TODO REMOVE

    this.hrLog.forEach((value, key) => {
      s += (key + "," + value + "\n"); 
      } 
    )

    return s;
  }

});

AFRAME.registerComponent('heartratemonitor', {
 dependencies: ['pairDevice'],

  init: function() {
    this.hrData = new Array(200).fill(10)



  },

});


