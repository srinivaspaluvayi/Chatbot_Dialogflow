var express= require('express');
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
var app=express();
//var date=require("date-and-time"); 
//MongoClient
const MongoClient=require('mongodb').MongoClient;
const url='mongodb://127.0.0.1:27017';
var randomstring = require("randomstring"); 
const dbName='userdata';

//parser
/*
const bodyparser=require('body-parser');
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());
*/
var user_name="";
var phone_num;
app.post("/dialogflow", express.json(), (req, res) => {
    
    const agent = new WebhookClient({ 
		request: req, response: res 
    });
   console.log(req.body);

async function user_authentication(agent)
{
   phone_num= agent.parameters.phone_number;
  const client = new MongoClient(url,{ useUnifiedTopology: true });
  await client.connect();
 // console.log(phone_num);
  //console.log(await client.db("userdata").collection("user_table").findOne({phone_number: phone_num}));
  const snap = await client.db("userdata").collection("user_table").findOne({phone_number: phone_num});
  
  if(snap==null){
	  await agent.add("Enter your username for registration:");

  }
  else
  {
  user_name=snap.username;
  console.log(snap);
  await agent.add("Welcome  "+user_name+"!!  \n How can I help you?");}
}
function user_registration(agent){
      user_name=agent.parameters.user_name.name;
     MongoClient.connect(url,{ useUnifiedTopology: true }, function(err, db) {
      if (err) throw err;
         var dbo = db.db("userdata");
      
    
        dbo.collection("user_table").insertOne({"username":user_name,"phone_number":phone_num}, function(err, res) {
        try{if (err) throw err;
        }
    catch(error){
    
        }
        db.close();    
      });
     });
     agent.add("Your Registration is successfully completed.How can I help you?");
}	
function report_issue(agent)
{
 
  var issue_values={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  
  const intent_val=agent.parameters.issue_num;
  if(intent_val>4 || intent_val<1){
    agent.add("Please choose a valid option:");
  }
  else{
  var val=issue_values[intent_val];
  
  var trouble_ticket=randomstring.generate(5);

 
  MongoClient.connect(url,{ useUnifiedTopology: true }, function(err, db) {
  if (err) throw err;
     var dbo = db.db("userdata");
    
	var u_name = user_name;    
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

	var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

    dbo.collection("user_issues").insertOne(myobj, function(err, res) {
    try{if (err) throw err;
    }
catch(error){

    }
    db.close();    
  });
 });
 agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
 console.log(trouble_ticket);
 }
}


function custom_payload(agent)
{
  agent.add("Choose an option:");
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        },
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}




var intentMap = new Map();
intentMap.set("Internet_service_intent", user_authentication);
intentMap.set('Internet_service_intent - custom', custom_payload);
intentMap.set('Internet_service_intent - custom-2', user_registration);
intentMap.set('Internet_service_intent - custom - custom', report_issue);


agent.handleRequest(intentMap);

});
app.listen(8080);