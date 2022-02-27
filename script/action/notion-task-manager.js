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
                    channel.send(doc.message[ Math.floor( Math.random* doc.message.length )])               
                }
                else{
                    channel.send("it's time for " + doc.name  +"!" )
                }
                
            }, null, null , process.env.TIMEZONE); 
            job.start();
        }
    }
}



var getCalendar = (wit_datetime ) =>{
    return [wit_datetime].map( t => {
        var _t = t.split("T");
        return {
            y : _t[0].split("-")[0],
            m : _t[0].split("-")[1],
            d : _t[0].split("-")[2],
            hour:  _t[1].split(":")[0],
            min:  _t[1].split(":")[1]
        }
    })[0];
}
var getCronTime = ( calendar )=> {
    var T = calendar ; var out = "";
    [T.min, T.hour, T.d , T.m, "*" ].forEach(
        t=> {out += t +" "}
    ) 
    return out.substring(0, out.length-1); 
}

var months = [ "January", "February", "March", "April", "May", "June", 
           "July", "August", "September", "October", "November", "December" ];

export function createReminder( _entities){
    var _time = _entities['wit$datetime:datetime'][0].value;
    var _agenda = "";
    if('wit$agenda_entry' in _entities){
        _agenda = _entities['wit$agenda_entry:agenda_entry'][0].value;
    }
    
    var _calendar = getCalendar(_time)
    var _cronTime = getCronTime(_calendar) ;

    // 1. 
    reminder.add({
        name : _agenda,
        cronTime : _cronTime, 
        message:[_agenda]
    })

    // 2. if it's same day, add cron
    var Days =  parseInt(new Date('2022,2,25') - new Date() ) / (1000 * 60 * 60 * 24) ;
    if (Days > 0 ){
        var job = new CronJob(_cronTime, ()=>{ 
            channel.send("it's time for " + _agenda  +"!" )
        }, null, null , process.env.TIMEZONE); 
        job.start();
    } 
    channel.send("I just created the new reminder for you at "
                    + months[ 1+_calendar.m ] + "." + _calendar.d
                    +" - " + _calendar.hour +" : " + _calendar.min );
}


var lineChange = `
`
