import { discord , channel} from './script/discord-handler.js'
import { witClient , findIntention } from './script/conversation/wit-handler.js';
import * as Action from './script/action/notion-task-manager.js'



discord.on("message", msg =>{
  if(!msg.author.bot){
      var mm = msg.content.toLowerCase();
      if ( mm == "clear"){
        Action.clearChannel();
      }
      else{
        talk( msg );
      }


      
    }
})

var bot = {}; //this will reset whenever the script reinitiates
function talk(msg){
  var mm = msg.content;
  witClient.message(mm).then( ( {entities, intents, traits} ) => {// 
    Promise.resolve(findIntention(entities, intents, traits)).then( findDB =>{
      
      console.log("🍎🍎🍎🍎🍎🍎🍎🍎🍎")
     // console.log(entities,",", intents,",",traits )
      console.log("🍎🍎🍎🍎🍎🍎🍎🍎🍎")
      

      
      if(findDB){
        if('message' in findDB ){
          var rand_message = findDB.message[ Math.floor(findDB.message.length * Math.random()) ]
          channel.send(rand_message) ;// send random message from the list
        }

        if('script' in findDB){
          if( !findDB.entities.includes('yes') && !findDB.entities.includes('no')){
            bot.script=  findDB.script[0]; 
            bot.entities=  entities;
            bot.intents=  intents;
            bot.traits=  traits;
            var alertMsg = 'alert' in findDB ? findDB.alert : "Do you want to run " + bot.script +"?"
            channel.send(alertMsg)
          }
          else{
            if( findDB.entities.includes("yes") ){
              if(bot.script){
                eval(bot.script);
              }
              else{
                channel.send("I don't understand what to do..")
              }
              
            }
            else{
              delete bot.script; 
            }
          }
        }
      }
      else{
        channel.send("What do you mean?")
      }
      
       

      
      
    })
    
    


  })
}
