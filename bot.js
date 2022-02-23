import { discord , channel} from './src/discord-handler.js'
import  { notionClient }  from "./src/notion-handler.js";
var notion = new notionClient(); 
import { Talk } from './src/message-handler.js'

var lineChange = `
`


discord.on("message", msg =>{

  if(!msg.author.bot){
    var mm = msg.content;
    //
    var ask_greeting = ["hey","hi","hello"]
    if( Talk( mm ,ask_greeting ) ){
      msg.reply( "Hey, Beautiful❤️" )
    }

    var ask_todo = ["todo", "to do"]
    if( Talk( mm , ask_todo ) ){
      var Do = async () =>{
        var pages = await notion.getPages( notion.databases["Worklog"] );
        var columns = await notion.getColumns( pages[0].id );
        var today = new Date().getDay() -1 ;
        
        var TodaysColumn = columns[today];
        var blocks = await notion.getChildren( TodaysColumn.id, {type:'to_do'} );
        var text = "🌈 This is your today's tasks,  "+ msg.author.username +" 😊"; 
        text += await notion.blocks_to_text(blocks); 

        msg.reply(text)
        }
        Do()
    }

    var ask_new = ["create new"]
    if( Talk(mm, ask_new) ){
      var Do = async () =>{
        await notion.createNewPage( notion.databases["Worklog"] ); 
        msg.reply(`I just created new [${mmdd(monday)}] Log for you!❤️`)
      }
      Do();
    }

    var ask_clear = ['clear']
    if( Talk(mm, ask_clear) ){
        async function clearChannel(){
          Promise.resolve( await channel.messages.fetch({limit: 100}) )
            .then( fetched =>{
              channel.bulkDelete(fetched);
            })
        }
        clearChannel()
    }
  //

  }



  
})


