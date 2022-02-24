const Fallback = require('./adapters/fallback')
const qFinderElastic = require('./adapters/elastic')
const MDFind = require('./adapters/osx-mdfind')
console.info("Try importing elastic")
const ElasticSearchClient = require('elasticsearchclient');

var serverOptions = {
    host: 'localhost',
    port: 9200
};
var elasticSearchClient = new ElasticSearchClient(serverOptions);
console.info("Elastic client is up!")

var adapter = null
module.exports = function (context, env = {}) {
  if (!adapter) {
    console.info("Go!")
    if (true)
    {
      console.info("Elastic search is installed")
      adapter = new qFinderElastic(context, env)
    }
    else if (MDFind.isInstalled()) {
      console.info("MDFind is instelled")
      adapter = new MDFind(context, env)
    } else {
      adapter = new Fallback(context, env)
    }
  }
  return adapter
}
