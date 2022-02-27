import { notion } from "../notion-handler.js";
import { channel } from "../discord-handler.js";
import { monday,mmdd } from '../scheduler.js';
import { reminder } from "../mongoDB/mongoDB.js";
import { CronJob } from 'cron'
import 'dotenv/config' // ES6


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
    console.log("❤️CreateNewLog()")
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



export async function reminderInit(){
    for await (const doc of reminder.model.find() ){
        
        if( "cronTime" in doc ){
            var job = new CronJob(doc.cronTime, ()=>{
                if("message" in doc && doc.message.length > 0 ){
                    //channel.send(doc.message[ Math.floor( Math.random* doc.message.length )])               
                }
                else{
                    channel.send(doc.name +"🍍" )
                }
                
    
            }, null, null , process.env.TIMEZONE); 
            job.start();
        }

    }
}
console.log("d") 
function setSchedule(cronTime, eventFunction ){new CronJob(cronTime, eventFunction, null, null , process.env.TIMEZONE).start();} 
setSchedule('1 * * * *',()=>{channel.send("🍍🍍🍍🍍")} ); 



var lineChange = `
`