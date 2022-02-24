import { discord , channel} from './src/discord-handler.js'
import  { notionClient }  from "./src/notion-handler.js";
var notion = new notionClient(); 
//import { Talk } from './src/message-handler.js'
import { witClient  , witCompare } from './src/wit-handler.js';



discord.on("message", msg =>{
  if(!msg.author.bot){
      talk( msg );}})


function talk(msg){
  var mm = msg.content;
  witClient.message(mm).then( ( {entities, intents, traits} ) => {//

    var style = {entities, intents, traits} ;
    

    
    if( witCompare( style, {intents : ["greeting"]} )){
        channel.send( "Hey, Beautiful❤️" )
    }
    
    if( witCompare( style, { entities :["task" ,"question"] } ) ){      
      var Do = async () =>{
        var pages = await notion.getPages( notion.databases["Worklog"] );
        var columns = await notion.getColumns( pages[0].id );
        var today = new Date().getDay() -1 ;
        
        var TodaysColumn = columns[today];
        var blocks = await notion.getChildren( TodaysColumn.id, {type:'to_do'} );
        var text = "🌈 This is your today's tasks,  "+ msg.author.username +" 😊"; 
        text += await notion.blocks_to_text(blocks); 
        channel.send(text)
      }
      Do()
    }
    
    if( witCompare( style, {intents : ["request"] , entities :["log" , "create"] } )   ){
        var Do = async () =>{
          await notion.createNewPage( notion.databases["Worklog"] ); 
          channel.send(`I just created new [${mmdd(monday)}] Log for you!❤️`)
        }
        Do();
    }
    
  })


  //
  if ( mm.toLowerCase() == "clear"){
    async function clearChannel(){
      Promise.resolve( await channel.messages.fetch({limit: 100}) )
        .then( fetched =>{
          channel.bulkDelete(fetched);
        })
    }
    clearChannel()
    channel.send(`Awesome New Beginning❤️`)
    
   
  }
  

}

var lineChange = `
`