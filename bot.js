import { discord , channel} from './script/handlers/discord-handler.js'
import { witClient , findIntention } from './script/handlers/wit-handler.js';
import * as Action from './script/action/Actions.js'



// Slash Command
/*
discord.on("interactionCreate", async interaction=>{
  if(interaction.isCommand()){
  }
})
*/ 



discord.on("messageCreate", async msg=>{
  if(!msg.author.bot){

    if(msg.attachments.size){
      //if there's attachment
    }
    else{
      var mm = msg.content.toLowerCase();

      if ( mm == "clear"){
        Action.clearChannel();
      }

      else{
        await talk( msg );
      }

    }

  }

})


var bot = {}; //this will reset whenever the script reinitiates
async function talk(msg){
  var mm = msg.content;
  witClient.message(mm).then( async ( {entities, intents, traits} ) => { 
    var findDB = await  findIntention(entities, intents, traits) ; 
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
