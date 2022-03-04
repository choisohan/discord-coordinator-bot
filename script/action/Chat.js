import * as Wit from '../handlers/wit-handler.js'
import * as Action from './Actions.js'
import { channel } from '../handlers/discord-handler.js';
var bot = {}; //this will reset whenever the script reinitiates

export async function send( mm ){
    if(mm == 'clear'){Action.clearChannel()}
    else{
        
    Wit.client.message(mm).then( async ( {entities, intents, traits} ) => { 
  
      var entities = Wit.entitiesFilter(entities); 
      var intents = Wit.intentFilter(intents); 
      var traits = Wit.traitFilter(traits); 
      //console.log( "🎈",entities )
  
  
      var findDB = await  Wit.findIntention( entities, intents, traits) ; 
      if(findDB){
        //bot.entities = entities;bot.intents=  intents;bot.traits=  traits;

        if('message' in findDB ){
          var rand_message = findDB.message[ Math.floor(findDB.message.length * Math.random()) ] ;
          channel.send(rand_message) ; // send random message from the list
        }
        if('script' in findDB ){eval( await findDB.script[0] )}
      }
      else{channel.send("?")}
        })
    }
  }

//var positive = ['😍','🙏','❤️',]
export async function emojiReaction( emoij ){
    
}