const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const request = require('request');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
      res.status(403).send('Error wrong token');
    }
  });
  

 /* Handling all messenges */
 app.post('/', (req, res) => {
   //console.log(req.body);
   console.log(JSON.stringify(req.body));
    /*if (req.body.object === 'page') {
      req.body.entry.forEach((entry) => {
        entry.messaging.forEach((event) => {
          if (event.message && event.message.text) {
            sendMessage(event);
          }
        });
      });
      res.status(200).end();
    }
    */
    res.status(200).end();
  });



  function sendMessage(event) {
  
    let sender = event.sender.id;
    console.log(event.message.text);
    //console.log(JSON.stringify(event));
    //FB.api(sender, function(response) { console.log(response); });
    let text='';
    let name;
    if(checkMessageFormat(event.message.text)!=-1)
    {
      request({
        url: "https://graph.facebook.com/v3.2/" + sender,
        qs: {
            access_token : 'EAAfTifl8Qi0BAEEvlp83rIkARRgTE3uwvKAPcjkunWzO2pBZAJH7AFfeEkMufGQEYyZBOSWNohs7MCrqTCJ5h4FZBl8LzBY49CCXk2Iq2BqbA87vnbgdUKBBuz8ojAGGkZC41tPDnEha6amNhBPvMudDsKCZAThfJoWztS8AWnwZDZD',
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
      //console.log(data[0]);
        dataDB={
          "Location": data[0],
          "Type": data[2],
          "Body": data[1],
          "Timestamp": event.timestamp,
          "IssuerID": sender,
          "Name": name,
          "Platform": 'Facebook',
          "approved": false,
          "cssClass": "is-info",
          "logoURL":  "http://pngimg.com/imgs/logos/facebook_logos/" 
        };
        //console.log(name);
          //ref.push(dataDB);
      }
    });
    //console.log(name);
    
      
     
      text="Your complaint has been recorded. Once it gets approved by the manager, we'll get back to you.";
    }
    else
    {
      text = "Message not formatted properly. Please refer to the instructions at https://domain.com/instructions";
    }
    
    
    request({
      url: 'https://graph.facebook.com/v3.2/me/messages',
      qs: {access_token: 'EAAfTifl8Qi0BAEEvlp83rIkARRgTE3uwvKAPcjkunWzO2pBZAJH7AFfeEkMufGQEYyZBOSWNohs7MCrqTCJ5h4FZBl8LzBY49CCXk2Iq2BqbA87vnbgdUKBBuz8ojAGGkZC41tPDnEha6amNhBPvMudDsKCZAThfJoWztS8AWnwZDZD'},
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

  

  function checkMessageFormat(str) {
    var s;
    s = str.toLowerCase();
    var pos1=s.indexOf("location:");
    var pos2=s.indexOf("type:");
    var pos3=s.indexOf("body:");
    if(pos1==-1 || pos2==-1 || pos3==-1)
    {
        return -1;
    }
    else
    {
        var map = new Map();
        var pos4=s.length;
        var ind=[pos1,pos2,pos3,pos4]
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
            else if(s[ind[0]]=="b")
            {
                var s1="";
                for(var i=ind[0]+5;i<ind[1];i++)
                {
                    s1+=str[i];
                }
                 map.set("body",s1);
              
            }
            else
            {
                var s1="";
                for(var i=ind[0]+5;i<ind[1];i++)
                {
                    s1+=str[i];
                }
                map.set("type",s1);
                   
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
            else if(s[ind[1]]=="b")
            {
                var s1="";
                for(var i=ind[1]+5;i<ind[2];i++)
                {
                    s1+=str[i];
                }
                map.set("body",s1);
            }
            else
            {
                var s1="";
                for(var i=ind[1]+5;i<ind[2];i++)
                {
                    s1+=str[i];
                }
                map.set("type",s1);
            }
            if(s[ind[2]]=="l")
            {
                var s1="";
                for(var i=ind[2]+9;i<ind[3];i++)
                {
                    s1+=str[i];
                }
                map.set("location",s1);
            }
            else if(s[ind[2]]=="b")
            {
                var s1="";
                for(var i=ind[2]+5;i<ind[3];i++)
                {
                    s1+=str[i];
                }
                map.set("body",s1);
            }
            else
            {
                var s1="";
                for(var i=ind[2]+5;i<ind[3];i++)
                {
                    s1+=str[i];
                }
                map.set("type",s1);
            }
            var fin=[map.get("location"),map.get("body"),map.get("type")];
            return fin;
        }
       
    }
  }