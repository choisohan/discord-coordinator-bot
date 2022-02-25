import { discord , channel} from './script/discord-handler.js'
//import  { notion }  from "./script/notion-handler.js";
//var notion = new notionClient(); 
//import { Talk } from './src/message-handler.js'
import { witClient  , witCompare } from './script/wit-handler.js';
//import { Action }  from './action/actions.js'
import * as Action from './action/notion-task-manager.js'

discord.on("message", msg =>{
  if(!msg.author.bot){
      var mm = msg.content.toLowerCase();
      if ( mm == "clear"){
        Action.clearChannel();
      }
      else if( mm == "t" ){
        Action.MoveTodaysLeftTask();
        //for test
        // 0. Filter undone tasks of today


        //
      }
      else{
        //talk( msg );
      }


      
    }
})


function talk(msg){
  var mm = msg.content;
  witClient.message(mm).then( ( {entities, intents, traits} ) => {//
    var style = {entities, intents, traits} ;
    if( witCompare( style, {intents : ["greeting"]} )){channel.send( "Hey, Beautiful❤️" )}
    if( witCompare( style, { entities :["task" ,"question"] } ) ){Action.TellMeABoutTodaysTask();}
    if( witCompare( style, {intents : ["request"] , entities :["log" , "create"] } )   ){Action.CreateNewLog();}
  })
  
}
