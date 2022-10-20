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
        if(!app.includes(".") && !app.includes("start") && !app.includes("explorer.exe")){
          console.info("It's Email")
          app = path.join(path.join(__dirname, "start_outlook_id.dist"), "start_outlook_id.exe") + " " + app
        }
        else if(!app.includes("start") && !app.includes("explorer.exe")){app = "\"".concat(app).concat("\"")}
        
        if(app.includes("explorer.exe")){
          app = app.replace("/select", "select").replace("/", "\\").replace("select", "/select")
        }
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
