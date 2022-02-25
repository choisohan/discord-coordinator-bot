import { discord , channel} from './script/discord-handler.js'
//import  { notion }  from "./script/notion-handler.js";
//var notion = new notionClient(); 
//import { Talk } from './src/message-handler.js'
import { witClient  , witCompare , findIntention } from './script/conversation/wit-handler.js';
//import { Action }  from './action/actions.js'
import * as Action from './action/notion-task-manager.js'


//import fs from 'fs'
//const  talkDict = JSON.parse(fs.readFileSync('./script/conversation/chat-dictionary.json'));

talk( "what is todays tasks?" );
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

function talk(msg){
  var mm = msg.content;
  witClient.message(mm).then( ( {entities, intents, traits} ) => {//
    findIntention(entities, intents, traits)


    //console.log( entities,"🍎" , intents, "🍎"  ,traits )
    /*
    var style = {entities, intents, traits} ;
    if( witCompare( style, {intents : ["greeting"]} )){channel.send( "Hey, Beautiful❤️" )}
    if( witCompare( style, { entities :["task" ,"question"] } ) ){Action.TellMeABoutTodaysTask();}
    if( witCompare( style, {intents : ["request"] , entities :["log" , "create"] } )   ){Action.CreateNewLog();}
    */ 
  
  })
  
}
