import * as Wit from '../handlers/wit-handler.js'
import * as Action from './Actions.js'
import { channel } from '../handlers/discord-handler.js';
import * as Search from '../handlers/search-handler.js'
var bot = {}; //this will reset whenever the script reinitiates


export async function send( mm ){
    if(mm == 'clear'){Action.clearChannel()}
    else{
    Wit.client.message(mm).then( async ( {entities, intents, traits} ) => { 
  
      var entities = Wit.entitiesFilter(entities); 
      var intents = Wit.intentFilter(intents); 
      var traits = Wit.traitFilter(traits); 
  
      var findDB = await  Wit.findIntention( entities, intents, traits) ; 
      if(findDB){

        if('message' in findDB ){
          var rand_message = findDB.message[ Math.floor(findDB.message.length * Math.random()) ] ;
          channel.send(rand_message) ; // send random message from the list
        }
        if('script' in findDB ){eval( await findDB.script[0] )}
      }
      else{
        // JUST CHAT
        var keywords = Object.keys(entities);
        keywords = keywords[ Math.floor(keywords.length * Math.random()) ]
        var gif = await Search.getGIF( keywords );
        channel.send(gif);

      }
      })
    }
  }
//https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json
var yes = ['👍','😍','🙏','❤️',"💯","👌","💖","😃","😄","😆","😆","😀","😁","😇","😎","🔥"]
var no = ['😑','😬','👎']

export async function emojiReaction( _emoji ){
    if(yes.includes(_emoji)){
        Action.respondYes(); 
    }
    else if(no.includes(_emoji)){
        Action.respondNo(); 
    }
}
