const fs = require('fs')
const fuzzyfind = require('fuzzyfind')
const mkdirp = require('mkdirp')
const path = require('path')
const freshRequire = require('./freshRequire')
const ElasticSearchClient = require('elasticsearchclient');

class Cache {
  constructor (cwd, name) {
    this.cwd = cwd
    this.path = path.join(cwd, 'data', `${name}.json`)
    console.info("Try importing elastic")
    
    var serverOptions = {
      host: 'localhost',
      port: 9200
    };
    this.elasticSearchClient = new ElasticSearchClient(serverOptions);
    console.info("Elastic client is up!")
  }

  search (query, env = {}) {
    return new Promise(resolve => {
      if (fs.existsSync(this.path)) {
        /*
        const db = freshRequire(this.path)
        const results = (env.matchBy === 'stringincludes'
          ? db.filter(obj => (obj.title + obj.subtitle).toLowerCase().includes(query.toLowerCase()))
          : fuzzyfind(query, db, { accessor: obj => obj.title + obj.subtitle })
        ).slice(0, 20)
        */
        
        
        var qryObj = {
          "query" : {
            "query_string" : { 
              "query": query,
              "default_field": "filename"
            }
          }
        }
        
        var results_elastic = null;
        
        this.elasticSearchClient.search('0', 'text', qryObj)
          .on('data', function(data) {
              results_elastic = JSON.parse(data)
              console.info(JSON.parse(data))
          })
          .on('done', function(){
              //always returns 0 right now
          })
          .on('error', function(error){
              console.log(error)
          })
          .exec()

        console.info("Search tested")
        console.info(results_elastic.total)
        //Daniel Modify
        

        //console.info(results)
        var data_elastic = {
          icon: 'ide',
          title: 'ide',
          subtitle: 'sad',
          value: 'c:\\'
        };
        console.info([data_elastic])

        return resolve([data_elastic])
      }
      //  for other cases just return empty array
      resolve([])
    })
  }

  update (data) {
    return new Promise((resolve, reject) => {
      mkdirp.sync(path.dirname(this.path))
      const json = JSON.stringify(data)
      fs.writeFile(this.path, json, error => (error ? reject(error) : resolve(data)))
    })
  }
}

module.exports = Cache
