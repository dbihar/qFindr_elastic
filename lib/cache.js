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
    
    this.elastic_results = null

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
              "query": "*".concat(query).replace(' ', ' OR ').concat("*"),
              "fields": ["filename", "path", "text"]
              //"default_field": "filename",
            }
          }
        }
        
        var tmp = {
          icon: 'ide',
          title: "...",
          subtitle: "...",
          value: 'c:\\'
        };

        var results = []

        this.elasticSearchClient.search('0', 'text', qryObj)
          .on('data', function(data) {
              this.elastic_results = JSON.parse(data)
              console.info("Search tested:")
              //console.info(this.elastic_results)
              console.info("Total hits:" + this.elastic_results.hits.total);

              
              var jsonArray = this.elastic_results.hits.hits
              for(var i = 0; i < jsonArray.length; i++)
              {
                var filename = jsonArray[i]["_source"].filename
                console.info(filename);
                if(filename.length < 4){filename = jsonArray[i]["_source"].path.split("/")[-1]}

                var tmp = {
                  icon: 'ide',
                  title: jsonArray[i]["_source"].filename,
                  subtitle: jsonArray[i]["_source"].path,
                  value: jsonArray[i]["_source"].path.split("-->")[0]
                };
                results.push(tmp)
              }
              tmp = results
              //console.info(results);
              return resolve(results)
          })
          .on('done', function(){
              //return resolve(results)
          })
          .on('error', function(error){
              console.log(error)
          })
          .exec()

        //Daniel Modify
        var tmp = {
          icon: 'ide',
          title: "...",
          subtitle: "...",
          value: 'c:\\'
        };
        //return resolve([tmp])
      }
      //  for other cases just return empty array
      //resolve([])
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
