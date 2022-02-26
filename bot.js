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

var store = {script : null, isTalking : false}; //this will reset whenever the script reinitiates
function talk(msg){
  var mm = msg.content;
  witClient.message(mm).then( ( {entities, intents, traits} ) => {//
    
    console.log( "🍎🍎🍎🍎🍎🍎🍎")
    console.log( entities,"," , intents, ","  ,traits )
    console.log( "🍎🍎🍎🍎🍎🍎🍎")
    
    
    Promise.resolve(findIntention(entities, intents, traits)).then( findDB =>{
      console.log( "🍎",findDB)
      if (findDB){
        if('message' in findDB ){
          var rand_message = findDB.message[ Math.floor(findDB.message.length * Math.random()) ]
          channel.send(rand_message) ;// send random message from the list
        }
        
        if('script' in findDB){
          if( ! "isTalking" in  store ||!store.isTalking){
            //ask before Run
            channel.send('Do you want me to run' + findDB.script[0]  +' ?'); 
            store = {isTalking : true , script : findDB.script[0]} ; 
          }
          else{
            eval(store.script) ;// finally run
            store = {}; 
          }
        }
      }
      else{ //failed to find
        channel.send("What do you mean?")
      }
      

      
    })
    


  })
}
