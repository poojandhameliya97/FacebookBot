const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const request = require('request');
var querystring = require('querystring');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var type;
const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

var admin = require('firebase-admin');

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://complaintsapp-cfa95.firebaseio.com"
});

var db=admin.database();
var ref = db.ref('/twittercomplaints');



//For facebook Validation
app.get('/', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === process.env.VERIFICATION_TOKEN) {
      res.status(200).send(req.query['hub.challenge']);
    } else {
      res.status(403).send('Deployed');
    }
  });
  

 /* Handling all messenges */
 app.post('/', (req, res) => {
   //console.log(req.body);
   //console.log(JSON.stringify(req.body));
    if (req.body.object === 'page') {
      req.body.entry.forEach((entry) => {
        entry.messaging.forEach((event) => {
          if (event.message && event.message.text) {
            sendMessage(event);
          }
        });
      });
      res.status(200).end();
    }
    
    //res.status(200).end();
  });

//For getting the type of the complaint, we have used microsoft azure and trained it.
  function getLuisIntent(utterance,callback) {
   
    // endpoint URL
    var endpoint =
        "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";

    // Set the LUIS_APP_ID environment variable 
    // to df67dcdb-c37d-46af-88e1-8b97951ca1c2, which is the ID
    // of a public sample application.    
    var luisAppId = process.env.LUIS_APP_ID;

    // Read LUIS key from environment file ".env"
    // You can use the authoring key instead of the endpoint key. 
    // The authoring key allows 1000 endpoint queries a month.
    var endpointKey = process.env.LUIS_ENDPOINT_KEY;

    // Create query string 
    var queryParams = {
        "verbose":  true,
        "q": utterance,
        "subscription-key": endpointKey
    }

    // append query string to endpoint URL
    var luisRequest =
        endpoint + luisAppId +
        '?' + querystring.stringify(queryParams);
    
    // HTTP Request
    request(luisRequest,utterance,
        function (err,
            response, body) {

            // HTTP Response
            if (err)
                console.log(err);
            else {
                utterance = JSON.parse(body);
                return callback(utterance.topScoringIntent.intent);
                console.log(`Query: ${data.query}`);
                console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                console.log('Intents:');
                console.log(JSON.stringify(data.intents));
                type=data.topScoringIntent.intent;
                console.log(type);
               
                
              }
        });
       
}


  function sendMessage(event) {
  
    let sender = event.sender.id;
    //console.log(event.message.text);
    //console.log(JSON.stringify(event));
    //FB.api(sender, function(response) { console.log(response); });
    let text='';
    let name;
    let newData;
    if(checkMessageFormat(event.message.text)!=-1)
    {
      request({
        url: "https://graph.facebook.com/v3.2/" + sender,
        qs: {
            access_token : 'EAAfTifl8Qi0BAPSgCVJb9fbtBGO8F7BOSGFVkRu6IDNYZBOY7lfUcQ4ZCENzFBoaPrxRh0msMuoy7aQXH26PVZAS0ZA1mC8lZAZBJ27Jj2XQ8zyfkscsOE7QXgSyMvBbBACadKBOzZAykAqZBu8LAbNBaVsbxVongZCAyxAbaCh6x0QZDZD',
            fields: "first_name"
        },
        method: "GET",

    }, function(error, response, body) {
        if(error){
            console.log("error getting username")
        } else{
            var bodyObj = JSON.parse(body)
            //console.log(bodyObj);
            
            name = bodyObj.first_name;
            data=checkMessageFormat(event.message.text);
            console.log(data);
            getLuisIntent(data[1],function(val) {
              newData=val;
              //console.log(newData);
              dataDB={
                "Location": data[0],
                "Type": newData,
                "Body": data[1],
                "Timestamp": event.timestamp,
                "IssuerID": sender,
                "IssuerName": name,
                "platform": 'Facebook',
                "approved": 'false',
                "cssClass": "is-link",
                "logoURL":  "http://pngimg.com/uploads/facebook_logos/facebook_logos_PNG19751.png" 
              };
              console.log(newData);
              ref.push(dataDB);
            });

      }
    });
    
      
     
      text="Your complaint has been recorded. Once it gets approved by the manager, we'll get back to you.";
    }
    else
    {
      text = "Message not formatted properly. Please refer to the instructions at https://complaintsapp-cfa95.firebaseapp.com/instructions";
    }
    
    
    request({
      url: 'https://graph.facebook.com/v3.2/me/messages',
      qs: {access_token: 'EAAfTifl8Qi0BAPSgCVJb9fbtBGO8F7BOSGFVkRu6IDNYZBOY7lfUcQ4ZCENzFBoaPrxRh0msMuoy7aQXH26PVZAS0ZA1mC8lZAZBJ27Jj2XQ8zyfkscsOE7QXgSyMvBbBACadKBOzZAykAqZBu8LAbNBaVsbxVongZCAyxAbaCh6x0QZDZD'},
      method: 'POST',
      json: {
        recipient: {id: sender},
        message: {text: text}
      }
    }, function (error, response) {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
  }

  
//Checking format of the message
  function checkMessageFormat(str) {
    var s;
    s = str.toLowerCase();
    var pos1=s.indexOf("location:");
    var pos3=s.indexOf("body:");
    var pos2=s.indexOf("type");
    if(pos2!=-1)
    {
      return -1;
    }
    if(pos1==-1 || pos3==-1)
    {
        return -1;
    }
    else
    {
        var map = new Map();
        var pos4=s.length;
        var ind=[pos1,pos3,pos4]
        ind.sort();
        if(ind[0]!=0)
        {
            return -1;
        }
        else
        {
            if(s[ind[0]]=="l")
            {
                var s1="";
                for(var i=ind[0]+9;i<ind[1];i++)
                {
                    s1+=str[i];
                }
                map.set("location",s1);
            }
            else 
            {
                var s1="";
                for(var i=ind[0]+5;i<ind[1];i++)
                {
                    s1+=str[i];
                }
                 map.set("body",s1);
              
            }
            if(s[ind[1]]=="l")
            {
                var s1="";
                for(var i=ind[1]+9;i<ind[2];i++)
                {
                    s1+=str[i];
                }
                map.set("location",s1);
               
            }
            else 
            {
                var s1="";
                for(var i=ind[1]+5;i<ind[2];i++)
                {
                    s1+=str[i];
                }
                map.set("body",s1);
            }
            var fin=[map.get("location"),map.get("body")];
            return fin;
        }
       
    }
  }


  