const fs = require('fs')
const fuzzyfind = require('fuzzyfind')
const mkdirp = require('mkdirp')
const path = require('path')
const freshRequire = require('./freshRequire')
var ElasticSearchClient = require('elasticsearchclient');
var elasticsearch = require('elasticsearch');
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

    this.client = new elasticsearch.Client({
      hosts: [ 'http://localhost:9200/']
      });
    console.info("Elastic client is up!")
  }

  search (query, env = {}) {
    return new Promise(resolve => {
      if (fs.existsSync(this.path)) {
        
        /*
        // NEW ELASTIC SEACH 

        this.client.search({
          index: '0',
          q: '*.doc'
        }).then(function(resp) {
            console.info(resp)
            console.info(resp["hits"]);
        }, function(err) {
            console.trace(err.message);
        });
        */

        /*
        const db = freshRequire(this.path)
        const results = (env.matchBy === 'stringincludes'
          ? db.filter(obj => (obj.title + obj.subtitle).toLowerCase().includes(query.toLowerCase()))
          : fuzzyfind(query, db, { accessor: obj => obj.title + obj.subtitle })
        ).slice(0, 20)
        */
        var query_old = query

        if(query.split('"').length != 1 && query.split('"').length % 2 == 0)
        {
          query = query.concat("\"")
        }

        if((query.split('/').length + query.split('(').length + query.split(')').length + query.split('^').length) != 4)
        {
          query = query.replace(/\(/g, "* AND *").replace(/\)/g, "* AND *").replace(/\//g, "* AND *").replace(/\^/g, "* AND *")
        }
        
        query = query.replace(/  +/g, ' ');
        if(query[query.length-1] == " "){
          query = query.substring(0, query.length-1)
        }
        // Handling quotes
        //console.info(query)
        
        var list_q_orig = query.split("\"")
        query = "*".concat(query).replace(/ /g, "* AND *").concat("*")
        var list_q = query.split('"')

        var count_quote = 0
        var query_new = ""
        for (var item in list_q) {
          if(count_quote % 2 == 1){
            query_new = query_new.concat("\"" + list_q_orig[count_quote] + "\"")
          }
          else{
            query_new = query_new.concat(list_q[count_quote].replace(/\./g, "* AND *").replace(/\,/g, "* AND *").replace(/\:/g, "* AND *").replace(/\-/g, "* AND *").replace(/\_/g, "* AND *"))
          }
          count_quote ++;
        }
        query_new = query_new.replace(/\*\"/g, "\"").replace(/\"\*/g, "\"")
        query = query_new
        
        query = query.replace(/\*\*/g, "*")

        query = "(".concat(query).concat(") OR (\"").concat(query_old).concat("\")")
        console.info(query)
        //query = "*".concat(query).replace(/ /g, "* AND *").concat("*")
        var qryObj = {
          "size": 50,
          "query" : {
            "query_string" : { 
              "query": query,
              //"fields": ["filename^2", "path^6", "text^1", "subject^3", "sender_name^4", "recipients_names^5", "timestamp^7"],
              "fields": ["filename^1", "path^6", "text^3",  "subject^2", "sender_name^4", "recipients_names^5"],
              //"default_field": "path",
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
          this.elasticSearchClient.search('*', '_doc', qryObj)
            .on('data', function(data) {
                this.elastic_results = JSON.parse(data)
                //console.info("Search tested:")
                //console.info(this.elastic_results)
                var HITS_NUM = 0
                try{
                  HITS_NUM = this.elastic_results.hits.total.value
                  console.info(HITS_NUM)
                  console.info("Total hits:" + HITS_NUM);
                  //console.info("Total hits:" + this.elastic_results.hits.hits);
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
                  // Check if its result from outlook and populate filename and path
                  var filename = jsonArray[i]["_source"].filename
                  var path_short = jsonArray[i]["_source"].path
                  var is_msg = false
                  var date_el = ""

                  if (typeof jsonArray[i]["_source"].path === 'undefined') {
                    if (typeof jsonArray[i]["_source"].filename === 'undefined'){
                      //console.info("This is msg result")
                      jsonArray[i]["_source"].filename = "E-mail | Subject: " + jsonArray[i]["_source"].subject + " | Sender: " + jsonArray[i]["_source"].sender_name
                      jsonArray[i]["_source"].path = "Recipients: " + jsonArray[i]["_source"].recipients_names.join(', ')
                    }
                    else{
                      //console.info("This is atach result")
                      jsonArray[i]["_source"].path = "E-mail | Subject: " + jsonArray[i]["_source"].subject + " | Sender: " + jsonArray[i]["_source"].sender_name
                    }
                    // color is undefined
                    is_msg = true
                  }
                  if(is_msg){
                    filename = jsonArray[i]["_source"].filename
                    path_short = jsonArray[i]["_source"].path
                  }

                  //console.info(filename);
                  try{
                    if(filename.length < 4){filename = jsonArray[i]["_source"].path.split("/")[-1]}
                    if(filename.length == 0){continue}
                  }
                  catch{
                    continue
                  }
                  var tmp = null
                  // Shortening path:
                  if(path_short.length > 75){
                    path_short = path_short.substring(0,30).concat("...").concat(path_short.substring(path_short.length-42, path_short.length))
                  }
                  
                  // Shortening filename
                  if(jsonArray[i]["_source"].filename.length > 81){
                    jsonArray[i]["_source"].filename = jsonArray[i]["_source"].filename.substring(0,31).concat("...").concat(path_short.substring(jsonArray[i]["_source"].filename.length-40, jsonArray[i]["_source"].filename.length))
                  }
                  
                  //Getting text context:
                  var text_doc = ""
                  try{text_doc = jsonArray[i]["_source"].text.substring(0,110).replace(/\n/g, " ").replace(/\t/g, " ").replace(/  /g, " ").replace(/  /g, " ").replace(/  /g, " ").replace(/  /g, " ")}catch{}

                  // Getting icons:
                  var ic = ''
                  var extension = jsonArray[i]["_source"].path.split(".")
                  extension = extension[extension.length - 1]
                  extension = extension.toLowerCase()
                  if(extension =='doc' || extension == 'docx' ||
                    extension =='dot' || extension =='odt'){ic='fa-duotone fa-file-word fa-2x'}
                  else if(extension =='ppt' || extension == 'pptx' ||
                          extension =='pps' || extension =='odp'){ic='fa-duotone fa-file-powerpoint fa-2x'}
                  else if(extension =='xls' || extension == 'xlsx' ||
                          extension =='ods'){ic='fa-duotone fa-file-excel fa-2x'}
                  else if(extension =='html' || extension == 'mht' ||
                          extension =='xml' || extension == 'htm'){ic='fa-duotone fa-file-code fa-2x'}
                  else if(extension =='csv'){ic='fa-duotone fa-file-csv fa-2x'}
                  else if(extension =='txt' || extension == 'rtf'){ic='fa-duotone fa-file fa-2x'}
                  else if(extension =='pdf'){ic='fa-duotone fa-file-pdf fa-2x'}
                  else if(extension =='exe' || extension =='bin' || extension =='msi'){ic='fa-duotone fa-rocket fa-2x'}
                  else if(extension =='zip' || extension =='rar' || 
                          extension =='cab' || extension =='bz' || extension =='gz' ||
                          extension =='xz'){ic='fa-duotone fa-file-archive fa-2x'}
                  else if(extension =='jpg' || extension =='jpeg' || 
                          extension =='bmp' || extension =='ico' || extension =='png' ||
                          extension =='ps'){ic='fa-duotone fa-file-image fa-2x'}
                  else{ic='fa-duotone fa-file fa-2x'}
                  
                  // Handle if it's outlook mail
                  if(is_msg){
                    ic = 'fa-duotone fa-envelope fa-2x'
                    date_el = jsonArray[i]["_source"].date_pretty
                    path_short = date_el + "    " + path_short
                    text_doc = ""
                  }
                  else
                  {
                    date_el = new Date(parseInt(jsonArray[i]["_source"].date_modify+"000"))
                    date_el = date_el.toDateString()
                    //console.info(date_el)
                    path_short = date_el + "    " + path_short
                    text_doc = ""
                  }

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
                      subtitle: path_short,
                      text_context: text_doc,
                      date: date_el,
                      value: "start \"\" ".concat(new_path),
                      hits: HITS_NUM
                    };
                    if(is_msg){
                      tmp.value=jsonArray[i]["_source"].msg_id
                    }
                  }
                  else{
                    tmp = {
                      icon: ic,
                      title: jsonArray[i]["_source"].filename,
                      subtitle: path_short,
                      text_context: text_doc,
                      date: date_el,
                      value: "start \"\" ".concat("\"".concat(jsonArray[i]["_source"].path).concat("\"")),
                      hits: HITS_NUM
                    };
                    if(is_msg){
                      ic = 'fa-duotone fa-envelope'
                      tmp.value=jsonArray[i]["_source"].msg_id
                    }
                  }
                  results.push(tmp)
                }
                tmp = results
                try{
                  results[0].hits = HITS_NUM
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