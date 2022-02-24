const fs = require('fs')
const path = require('path')
const File = require('../../lib/file')
console.info("Try importing elastic")
const ElasticSearchClient = require('elasticsearchclient');

class Finder {
  constructor (options) {
    this.options = options
    var serverOptions = {
      host: 'localhost',
      port: 9200
    };
    this.elasticSearchClient = new ElasticSearchClient(serverOptions);
    console.info("Elastic client is up!")
    var qryObj = {
      "query" : {
        "query_string" : { 
          "query": "*",
          "default_field": "filename"
        }
      }
    };

    this.elasticSearchClient.search('0', 'text', qryObj)
      .on('data', function(data) {
          console.log(JSON.parse(data))
      })
      .on('done', function(){
          //always returns 0 right now
      })
      .on('error', function(error){
          console.log(error)
      })
      .exec()
    console.info("Search tested")
  }

  findIn (searchPath) {
    return new Promise((resolve, reject) => {
      const file = new File(searchPath)
      file.getStats().then(() => {
        if (file.isBroken()) return resolve([])
        fs.readdir(searchPath, (err, fileNames) => {
          if (err) return reject(err)
          resolve(fileNames)
        })
      })
    }).then((fileNames) => {
      return fileNames.filter((file) => {
        return this.options.excludeName.indexOf(file) === -1
      }).map((fileName) => {
        return new File(path.join(searchPath, fileName))
      }).filter((fileModel) => {
        return fileModel.isViewable(this.options.excludePath)
      })
    }).then((filteredFiles) => {
      const promises = filteredFiles.map((fileModel) => {
        return fileModel.getStats()
      })
      return Promise.all(promises).then(() => {
        return filteredFiles.filter((file) => {
          return !file.isBroken()
        })
      })
    })
  }

  deepFind () {
    let files = []
    const promises = this.options.includePath.map((includePath) => {
      return this.deepFindIn(includePath).then((newFiles) => {
        files = files.concat(newFiles)
      })
    })
    return Promise.all(promises).then(() => {
      return files
    })
  }

  deepFindIn (searchPath) {
    return this.findIn(searchPath).then((files) => {
      const queue = []
      files.forEach((file) => {
        if (file.isDirectory()) {
          queue.push(this.deepFindIn(file.path).then((newFiles) => {
            files = files.concat(newFiles)
          }))
        }
      })
      return Promise.all(queue).then(() => {
        return files
      })
    })
  }
}

module.exports = Finder
