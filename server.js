'use strict';


// Declare our dependencies
var express = require('express');
var request = require('superagent');

var backendHost = process.env.BACK_HOST;
var backendPort = process.env.BACK_PORT;
var os = require('os');
var ifaces = os.networkInterfaces();

function getIpAdresses(){

  var ipAdresses= "";
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
  
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }
  
      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        ipAdresses += ifname + ': ' + alias, iface.address ;
      } else {
        // this interface has only one ipv4 adress
        ipAdresses += ifname+ ': ' + iface.address;
  
      }
      ++alias;
    });
    
  });
  
  return ipAdresses;
};

// Create our express app
var app = express();

// Set the view engine to use EJS as well as set the default views directory
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs').__express); //<-- this
app.set('views', __dirname + '/public/views');
// This tells Express out of which directory to serve static assets like CSS and images
app.use(express.static(__dirname + '/public'));



// The homepage route of our application does not interface with the MovieAnalyst API and is always accessible. We won’t use the getAccessToken middleware here. We’ll simply render the index.ejs view.
app.get('/', function(req, res){
  res.render('index');
})

// For the movies route, we’ll call the getAccessToken middleware to ensure we have an access token. If we do have a valid access_token, we’ll make a request with the superagent library and we’ll be sure to add our access_token in an Authorization header before making the request to our API.
// Once the request is sent out, our API will validate that the access_token has the right scope to request the /movies resource and if it does, will return the movie data. We’ll take this movie data, and pass it alongside our movies.ejs template for rendering
app.get('/movies', function(req, res){
  request
    .get('http://'+ backendHost + ':' + backendPort + '/movies')
    .end(function(err, data) {
      if(data.status == 403){
        res.send(403, '403 Forbidden');
      } else {
        var movies = data.body;
        res.render('movies', { movies: movies} );
      }
    })
})

// The process will be the same for the remaining routes. We’ll make sure to get the acess_token first and then make the request to our API to get the data.
// The key difference on the authors route, is that for our client, we’re naming the route /authors, but our API endpoint is /reviewers. Our route on the client does not have to match the API endpoint route.
app.get('/authors', function(req, res){
  request
    .get('http://'+backendHost + ':' + backendPort + '/reviewers')
    .set('Authorization', 'Bearer ' + req.access_token)
    .end(function(err, data) {
      if(data.status == 403){
        res.send(403, '403 Forbidden');
      } else {
        var authors = data.body;
        res.render('authors', {authors : authors});
      }
    })
})

app.get('/publications', function(req, res){
  request
    .get('http://'+backendHost + ':' + backendPort + '/publications')
    .end(function(err, data) {
      if(data.status == 403){
        res.send(403, '403 Forbidden');
      } else {
        var publications = data.body;
        res.render('publications', {publications : publications});
      }
    })
})

// We’ve added the pending route, but calling this route from the MovieAnalyst Website will always result in a 403 Forbidden error as this client does not have the admin scope required to get the data.
app.get('/pending', function(req, res){
  request
    .get('http://'+backendHost + ':' + backendPort + '/pending')
    .end(function(err, data) {
      if(data.status == 403){
        res.send(403, '403 Forbidden');
      }
    })
})

app.get('/front/ip', function(req, res){
  var backIp = getIpAdresses();
  res.json(backIp)
})

app.get('/back/ip', function(req, res){
  request
    .get('http://'+backendHost + ':' + backendPort + '/ip')
    .set('Authorization', 'Bearer ' + req.access_token)
    .end(function(err, data) {
      if(data.status == 403){
        res.send(403, '403 Forbidden');
      } else {
        var ip = data.body;
        res.json(ip);
      }
    })
})

console.log("server listening through port:  " + process.env.PORT);
app.listen(process.env.PORT);
module.exports = app;
