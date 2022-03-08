import * as Wit from '../handlers/wit-handler.js'
import * as Action from './Actions.js'
import { channel } from '../../bot.js'//'../handlers/discord-handler.js';

//https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json
var yes = ['👍','😍','🙏','❤️',"💯","👌","💖","😃","😄","😆","😆","😀","😁","😇","😎","🔥"]
var no = ['😑','😬','👎']

export async function send( mm ){
    if(mm.split(" ")[0] == 'clear'){Action.clearChannel()}
    else if( yes.includes(mm) || no.includes(mm) ){
      emojiReaction(mm)
    }
   // else if(mm.split(" ")[0] == 'translate'){Action.translate()}
   
    else{
    Wit.client.message(mm).then( async ( {entities, intents, traits} ) => { 
      var entities = Wit.entitiesFilter(entities); 
      var intents = Wit.intentFilter(intents); 
      var traits = Wit.traitFilter(traits); 
      
      var findDB =  await Wit.findIntention( entities, intents, traits) ; 
      if('message' in findDB ){
        var rand_message = findDB.message[ Math.floor(findDB.message.length * Math.random()) ] ;
        channel.send(rand_message) ; // send random message from the list
      }
      if('script' in findDB ){eval( await findDB.script[0] )}
      
      }
      
      )
    }
    
  }


export async function emojiReaction( _emoji ){
    if(yes.includes(_emoji)){
        Action.respondYes(); 
    }
    else if(no.includes(_emoji)){
        Action.respondNo(); 
    }
}
