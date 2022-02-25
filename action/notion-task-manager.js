import { notion } from "../script/notion-handler.js";
import { channel } from "../script/discord-handler.js";
import { monday,mmdd } from '../script/scheduler.js';


export var TellMeABoutTodaysTask = async () =>{
    var pages = await notion.getPages( notion.databases["Worklog"] );
    var columns = await notion.getColumns( pages[0].id );
    var today = new Date().getDay() -1 ; 
    var TodaysColumn = columns[today];
    var blocks = await notion.getChildren( TodaysColumn.id, {type:'to_do'} );
    var text = "🌈 This is your today's tasks, Min😊"; 
    text += await notion.blocks_to_text(blocks); 
    channel.send(text)
}

export var TellMeAboutTodaysLeftTask = async()=>{
    var pages = await notion.getPages( notion.databases["Worklog"] );
    var columns = await notion.getColumns( pages[0].id );
    var today = new Date().getDay() -1 ; 
    var TodaysColumn = columns[today];
    var blocks = await notion.getChildren( TodaysColumn.id, {type:'to_do'} );
    blocks = blocks.filter( b => !b.to_do.checked )
    var text = "🌈 This is your today's Left tasks, Min 😊" + lineChange; 
    text += await notion.blocks_to_text(blocks); 
    channel.send(text)
}

export var MoveTodaysLeftTask = async()=>{
    var pages = await notion.getPages( notion.databases["Worklog"] );
    var columns = await notion.getColumns( pages[0].id );
    var today = new Date().getDay() -1 ; 
    var TodaysColumn = columns[today];
    var blocks = await notion.getChildren( TodaysColumn.id, {type:'to_do'} );
    blocks = blocks.filter( b => !b.to_do.checked )

    blocks.forEach( async b =>{
        await notion.createNew( notion.databases["Tasks"] ,{
            Name: b.to_do.text[0].plain_text
        } )
        await notion.deleteItem(b.id)
    })
    var text = "I just moved today's left tasks to [Tasks]" 
    channel.send(text)
}



export var CreateNewLog = async () =>{
    await notion.createNewPage( notion.databases["Worklog"] ); 
    channel.send(`I just created new [${mmdd(monday)}] Log for you!❤️`)
}

export async function clearChannel(){
    Promise.resolve( await channel.messages.fetch({limit: 100}) )
      .then( fetched =>{
        channel.bulkDelete(fetched);
        channel.send(`Awesome New Beginning❤️`)
      })
}

export function test(){
    console.log('test')
}

var lineChange = `
`