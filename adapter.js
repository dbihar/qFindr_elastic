const Fallback = require('./adapters/fallback')
const qFinderElastic = require('./adapters/elastic')
const MDFind = require('./adapters/osx-mdfind')
console.info("Try importing elastic")

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })
console.info("Elastic client is up!")

var adapter = null
module.exports = function (context, env = {}) {
  if (!adapter) {
    console.info("idemooo!")

    /*
    client.ping({
      // ping usually has a 3000ms timeout
      requestTimeout: 200,
      // undocumented params are appended to the query string
      hello: "elasticsearch!"
    }, function (error) {
      if (error) {
        console.info('elasticsearch cluster is down!');
      } else {
        console.info('All is well');
      }
    });*/

    if (MDFind.isInstalled()) {
      adapter = new MDFind(context, env)
    } else {
      adapter = new Fallback(context, env)
    }
  }
  return adapter
}
