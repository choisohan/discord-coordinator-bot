import { discord , channel} from './script/handlers/discord-handler.js'
import { witClient , findIntention } from './script/handlers/wit-handler.js';
import * as Action from './script/action/notion-task-manager.js'
import {tweet} from './script/handlers/twitter-handler.js'



// Slash Command
discord.on("interactionCreate", async interaction=>{
  if(interaction.isCommand()){
    var name = interaction.commandName;
    var text = interaction.options._hoistedOptions[0].value 
    if(name == "tweet"){
      tweet(text);
      await interaction.reply("Tweeted")
    }
    if(name == "clear"){
      Action.clearChannel();
    }
  }
})

discord.on("messageCreate", async msg=>{
  if(!msg.author.bot){
    var mm = msg.content.toLowerCase();
    if ( mm == "clear"){
      Action.clearChannel();
    }
    else{
      talk( msg );
    }
  }})


var bot = {}; //this will reset whenever the script reinitiates
function talk(msg){
  var mm = msg.content;
  witClient.message(mm).then( ( {entities, intents, traits} ) => {// 
    Promise.resolve(findIntention(entities, intents, traits)).then( findDB =>{
      
      //console.log("🍎🍎🍎🍎🍎🍎🍎🍎🍎")
     // console.log(entities,",", intents,",",traits )
      //console.log("🍎🍎🍎🍎🍎🍎🍎🍎🍎")
      

      
      if(findDB){
        if('message' in findDB ){
          var rand_message = findDB.message[ Math.floor(findDB.message.length * Math.random()) ] ;
          channel.send(rand_message) ;// send random message from the list
        }

        if('script' in findDB ){
          if( !findDB.entities.includes('yes') && !findDB.entities.includes('no') ){
            if("alert" in findDB){
              bot.script=  findDB.script[0]; 
              bot.entities=  entities;
              bot.intents=  intents;
              bot.traits=  traits;
              var alertMsg = 'alert' in findDB ? findDB.alert : "Do you want to run " + bot.script +"?"
              channel.send(alertMsg)
            }
            else{
              eval(findDB.script[0])
            }

          }
          else{
            if( findDB.entities.includes("yes") ){
              if(bot.script){
                eval(bot.script);
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
        channel.send("What do you mean?")
      }
      
       

      
      
    })
    
    


  })
}
