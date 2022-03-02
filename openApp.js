const spawn = require('child_process').spawn
const os = require('os')
const path = require('path')

module.exports = (pluginContext) => {
  return (app, env = {}) => {
    return new Promise((resolve, reject) => {
      if (process.platform === 'win32' || process.platform === 'darwin') {
        //console.info("Run this:")
        //console.info(app)
        const exec = require('child_process').exec;
        const proccessing = exec(app);
        proccessing.stdout.on('data', function(data) {
          console.log(data); 
        });
        return resolve("")
      }

      // Use absolute paths at all time
      app = app.replace(/^~/, os.homedir())

      var p = spawn(app, [], {
        cwd: os.homedir(),
      })
      p.stderr.on('data', (data) => {
        console.error('err (' + path.basename(app) + '): ' + data)
      })

      reject() // break chain
    })
  }
}
