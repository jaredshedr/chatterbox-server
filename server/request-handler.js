let _ = require('underscore');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, authorization',
  'access-control-max-age': 10 // Seconds.
};

let messageArray = [];

const fileName = './server/database/messages.txt';

async function readMessageChunk(readable) {
  // parse result and store in messageArray
  for await (const chunk of readable) {
    // console.log('chunk is:', chunk);
    messageArray = JSON.parse(chunk);
  }
}

const readable = fs.createReadStream(
  fileName, {encoding: 'utf8'});
readMessageChunk(readable);

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  // The outgoing status.
  var statusCode = 200;

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.
  headers['Content-Type'] = 'application/json';


  let method = request.method;
  let url = request.url;
  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  // response.writeHead(statusCode, headers);

  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
  // response.end('Hello, World!!! Edited');



  // var data = fs.readFileSync(fileName, 'utf8');
  // if (data) {
  //   messageArray = (JSON.parse(data));
  // }

  let rewriteFile = function () {
    fs.writeFile(fileName, JSON.stringify(messageArray), err2 => {
      if (err2) {
        console.log(err2);
        return;
      }
    });
  };


  var setResponse = (response, statusCode, data) => {
    response.writeHead(statusCode, headers);
    data ? response.end(JSON.stringify(data)) : response.end();
  };

  if (url === '/classes/messages') {

    if (method === 'OPTIONS') {
      setResponse(response, 200);
    } else if (method === 'GET') {
      // response.writeHead(statusCode, headers);
      // const stream = fs.createReadStream(fileName);
      // stream.pipe(response);
      // console.log(messageArray);
      setResponse(response, 200, messageArray);
    } else if (method === 'POST') {
      let addedData = '';
      request.on('data', chunk => {
        addedData += chunk;
      });
      request.on('end', () => {
        let parsedObject = JSON.parse(addedData);
        let additionalInfo = {'message_id': uuidv4(), 'time_stamp': new Date()};
        _.extend(parsedObject, additionalInfo);
        if (typeof parsedObject === 'object') {
          messageArray.push(parsedObject);
        }
        setResponse(response, 201, [additionalInfo]);
        rewriteFile();
      });
    } else {
      setResponse(response, 404);
    }
  } else {
    setResponse(response, 404);
  }

};



// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
module.exports.requestHandler = requestHandler;