const fs = require('fs')
const fuzzyfind = require('fuzzyfind')
const mkdirp = require('mkdirp')
const path = require('path')
const freshRequire = require('./freshRequire')
const ElasticSearchClient = require('elasticsearchclient');
const { info } = require('console')

class Cache {
  constructor (cwd, name) {
    this.cwd = cwd
    this.path = path.join(cwd, 'data', `${name}.json`)
    //console.info("Try importing elastic")
    
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
        
        if(query.split('"').length != 1 && query.split('"').length % 2 == 0)
        {
          query = query.concat("\"")
        }

        if((query.split('/').length + query.split('(').length + query.split(')').length + query.split('^').length) != 4)
        {
          query = query.replace(/\(/g, "").replace(/\)/g, "").replace(/\//g, "").replace(/\^/g, "")
        }
        
        var qryObj = {
          "query" : {
            "query_string" : { 
              "query": "*".concat(query).concat("*"),
              "fields": ["filename", "path", "text"]
              //"default_field": "filename",
            }
          }
        }
        

        var results = []

        // Get the app
        const db = freshRequire(this.path)
        const results2 = (env.matchBy === 'stringincludes'
          ? db.filter(obj => (obj.title + obj.subtitle).toLowerCase().includes(query.toLowerCase()))
          : fuzzyfind(query, db, { accessor: obj => obj.title + obj.subtitle })
        ).slice(0, 10)
        
        try{
          this.elasticSearchClient.search('0', 'text', qryObj)
            .on('data', function(data) {
                this.elastic_results = JSON.parse(data)
                console.info("Search tested:")
                //console.info(this.elastic_results)
                try{
                  console.info("Total hits:" + this.elastic_results.hits.total);
                }
                catch{
                  return resolve([])
                }
                var jsonArray = this.elastic_results.hits.hits
                var len = 0
                try{
                  len = jsonArray.length
                }
                catch{
                  len = 0
                }
                for(var i = 0; i < len; i++)
                {
                  var filename = jsonArray[i]["_source"].filename
                  //console.info(filename);
                  try{
                    if(filename.length < 4){filename = jsonArray[i]["_source"].path.split("/")[-1]}
                    if(filename.length == 0){continue}
                  }
                  catch{
                    continue
                  }
                  var tmp = null

                  // Getting icons:
                  var ic = ''
                  var extension = jsonArray[i]["_source"].path.split(".")
                  extension = extension[extension.length - 1]
                  if(extension.toLowerCase() =='doc' || extension.toLowerCase() == 'docx' ||
                    extension.toLowerCase() =='dot' || extension.toLowerCase() =='odt'){ic='fa-regular fa-file-word'}
                  else if(extension.toLowerCase() =='ppt' || extension.toLowerCase() == 'pptx' ||
                          extension.toLowerCase() =='pps' || extension.toLowerCase() =='odp'){ic='fa-gular fa-presentation-screen'}
                  else if(extension.toLowerCase() =='xls' || extension == 'xlsx' ||
                          extension.toLowerCase() =='ods'){ic='fa-regular fa-file-excel'}
                  else if(extension.toLowerCase() =='csv'){ic='fa-regular fa-file-csv'}
                  else if(extension.toLowerCase() =='txt'){ic='fa-regular fa-file-lines'}
                  else if(extension.toLowerCase() =='pdf'){ic='fa-regular fa-file-pdf'}
                  else if(extension.toLowerCase() =='exe' || extension.toLowerCase() =='bin' || extension.toLowerCase() =='msi'){ic='fa-regular fa-rocket'}
                  else if(extension.toLowerCase() =='zip' || extension.toLowerCase() =='rar' || 
                          extension.toLowerCase() =='cab' || extension.toLowerCase() =='bz' || extension.toLowerCase() =='gz' ||
                          extension.toLowerCase() =='xz'){ic='fa-regular fa-file-zipper'}
                  else if(extension.toLowerCase() =='jpg' || extension.toLowerCase() =='jpeg' || 
                          extension.toLowerCase() =='bmp' || extension.toLowerCase() =='ico' || extension.toLowerCase() =='png' ||
                          extension.toLowerCase() =='ps'){ic='fa-regular fa-file-image'}
                  else{ic='fa-regular fa-file'}

                  if(jsonArray[i]["_source"].path.split("-->").length > 1){
                    var new_path = jsonArray[i]["_source"].path.replace(/.zip-->/g, ".zip\/").split("-->")[0]
                    var last_index = new_path.lastIndexOf("/")
                    //new_path = new_path.substring(0, last_index + 1)
                    //new_path = "".concat(new_path.replace(/\//g, "\"\/\"").replace(/\//g, "\\").replace(":\"\\", ":\\").concat("\""))
                    new_path = "\"".concat(new_path).replace(/\//g, "\\").concat("\"")
                    //new_path = new_path.substring(0, new_path.length-2)
                    //console.info(new_path)
                    tmp = {
                      icon: ic,
                      //icon: 'ide.svg',
                      title: jsonArray[i]["_source"].filename,
                      subtitle: jsonArray[i]["_source"].path,
                      value: new_path
                    };
                  }
                  else{
                    tmp = {
                      icon: ic,
                      title: jsonArray[i]["_source"].filename,
                      subtitle: jsonArray[i]["_source"].path,
                      value: "\"".concat(jsonArray[i]["_source"].path).concat("\"")
                    };
                  }
                  results.push(tmp)
                }
                tmp = results
                try{
                if(results2.length > 0){results.unshift(results2[0]);}
                }
                catch{
                    console.info("No results in program list")
                }
                //console.info(results[0]);
                return resolve(results)
            })
            .on('done', function(){
                //return resolve(results)
            })
            .on('error', function(error){
                console.log(error)
            })
            .exec()
          }
          catch{
            console.info("Elastic search error")
          }

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