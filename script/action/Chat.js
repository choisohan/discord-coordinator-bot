import * as Wit from '../handlers/wit-handler.js'
import * as Action from './Actions.js'

var bot = {}; //this will reset whenever the script reinitiates

export async function send(mm){
    //var mm = msg.content;
    Wit.client.message(mm).then( async ( {entities, intents, traits} ) => { 
  
      var entities = Wit.entitiesFilter(entities); 
      var intents = Wit.intentFilter(intents); 
      var traits = Wit.traitFilter(traits); 

      console.log( "🎈",entities )
  
  
      var findDB = await  Wit.findIntention( entities, intents, traits) ; 
      if(findDB){
        bot.entities = entities;bot.intents=  intents;bot.traits=  traits;
  
        if('message' in findDB ){
          var rand_message = findDB.message[ Math.floor(findDB.message.length * Math.random()) ] ;
          channel.send(rand_message) ; // send random message from the list
        }
  
        if('script' in findDB ){
          if( !findDB.entities.includes('yes') && !findDB.entities.includes('no') ){
            if("alert" in findDB){
              bot.script =  await findDB.script[0]; 
              var alertMsg = 'alert' in findDB ? findDB.alert : "Do you want to run " + bot.script +"?"
              channel.send(alertMsg)
            }
            else{
              eval( await findDB.script[0] )
            }
          }
          else{
            if( findDB.entities.includes("yes") ){
              if( bot.script ) {
                eval( await bot.script);
              }
              else{
                channel.send("I don't understand what to do.." )
              }
              
            }
            else{
              delete bot.script; 
            }
          }
        }
      }
      else{
        channel.send("?")
      }
        
       // console.log("🍎🍎🍎🍎🍎🍎🍎🍎🍎")
       // console.log(entities,",", intents,",",traits )
        //console.log("🍎🍎🍎🍎🍎🍎🍎🍎🍎")
  
    })
  }