const spawn = require('child_process').spawn
const os = require('os')
const path = require('path')
const nodeCmd = require('node-cmd');
const exec = require('child_process').exec;

module.exports = (pluginContext) => {
  return (app, env = {}) => {
    return new Promise((resolve, reject) => {
      if (process.platform === 'win32' || process.platform === 'darwin') {
        console.info("Run this:")
        if(!app.includes("start")){app = "\"".concat(app).concat("\"")}
        console.info(app)
        
        const proccessing = exec(app);
        proccessing.stdout.on('data', function(data) {
          console.log(data); 
        });
        console.log(consoproccessing.exitCode)
        //nodeCmd.get(app, (err, data, stderr) => console.log(data));
        return resolve(app)
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
