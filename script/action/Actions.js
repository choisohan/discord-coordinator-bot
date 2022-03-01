import { notion } from "../handlers/notion-handler.js";
import { channel,newEmbed } from "../handlers/discord-handler.js";
import { monday,mmdd } from '../extra/scheduler.js';
import { reminder } from "../handlers/mongo-handler.js";
import { CronJob } from 'cron'
import 'dotenv/config' // ES6
import { entitiesFilter } from "../handlers/wit-handler.js";
import { allisIn  } from "../extra/compare.js";
import { TweetSearchRecentV2Paginator } from "twitter-api-v2";


export var TellMeABoutTodaysTask = async () =>{
    var pages = await notion.getPages( notion.databases["Worklog"] );
    var columns = await notion.getColumns( pages[0].id );
    console.log( "columns.length : ", columns.length)
    var today = new Date().getDay() ; 
    today = today == 0 ? 6: today - 1; 
    console.log( "today : ", today)
    var TodaysColumn = columns[today]; 
    console.log( "TodaysColumn : ", TodaysColumn)
    var blocks = await notion.getChildren( TodaysColumn.id, {type:'to_do'} );
    var text = await notion.blocks_to_text(blocks); 

    var _newEmbed = newEmbed( {title: "🌈 " + new Date().toDateString() ,field :{name : "Things to do"  ,value : text } } )
    channel.send({embeds : [_newEmbed] })
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
    
    var pages = await notion.getPages( notion.databases["Worklog"] );
    var latest = pages[0];
    await notion.spreadItem(latest , 7 ); 

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
            console.log(doc.cronTime )            
            var job =new CronJob(doc.cronTime, ()=>{setAlarm(doc);                    
                }, null, null , process.env.TIMEZONE)
            job.start()
        }
    }
}

//new CronJob("1/", ()=>{console.log("🐣")}).start;                    




var getCalendar = (wit_datetime ) =>{
    return [wit_datetime].map( t => {
        var _t = t.split("T");
        return {
            min:  _t[1].split(":")[1],
            hour:  _t[1].split(":")[0],
            day : _t[0].split("-")[2],
            month : _t[0].split("-")[1],
            year : _t[0].split("-")[0],
        }
    })[0];
}
var getCronTime = ( _cal )=> {
    var out = ""; var CAL ={ min: "*", hour:"*", day: "*", month: "*"}; 
    if( allisIn(["year","month","day","hour","min"],Object.keys(_cal))){
        //this is calendar
        CAL = _cal; 
    }
    else{
        var today= new Date(); 
        if("minute" in _cal){
            CAL.min = "*/"+_cal.minute.toString();
        } 
        else if ("hour" in _cal){
            CAL.min = today.getMinutes();
            CAL.hour = "*/" + _cal.hour.toString();
        }
        else if ("month" in _cal){
            CAL.min = today.getMinutes();
            CAL.hour = today.getHours();
            CAL.day = today.getDay();
            CAL.month = "*/"+ _cal.month.toString(); 
        }
        else if ("year" in _cal){
            CAL.min = today.getMinutes();
            CAL.hour = today.getHours();
            CAL.day = today.getDay();
            CAL.month =  today.getMonth(); 
        }
    }

    [CAL.min, CAL.hour, CAL.day , CAL.month, "*" ].forEach(
        t=> {out += t +" "}
    ) 
    return out.substring(0, out.length-1); 
}

var months = [ "January", "February", "March", "April", "May", "June", 
           "July", "August", "September", "October", "November", "December" ];

        


export function createReminder( _entities){
    var entitie = entitiesFilter(_entities); 
    console.log( entitie)
    
    
    
    var _agenda = entitie.agenda_entry ? entitie.agenda_entry : "something" ;
    var _isRecurring = entitie.every ? true : false

    var _calendar = "datetime" in entitie ? getCalendar(entitie.datetime) : null;
    var _duration = "duration" in entitie ? entitie.duration : null ; 

    var _cronTime = _calendar ?  getCronTime(_calendar) : _duration ? getCronTime(_duration) : null;
    if(_cronTime){
        // 1. add to doc
        Promise.resolve(reminder.add({
            name : _agenda,
            cronTime : _cronTime, 
            message:[_agenda],
            script: null,
            isRecurring: _isRecurring
        })).then(doc=>{

            // 2. if it's same day, add cron
            var Days =  parseInt(new Date('2022,2,25') - new Date() ) / (1000 * 60 * 60 * 24) ;
            if (Days > 0 ){
                var job = new CronJob(_cronTime, ()=>{ 
                    setAlarm(doc); 
                }, null, null , process.env.TIMEZONE); 
                job.start();
            } 
            channel.send("I just created the ✨⏰new reminder for you");
        
        })
    }
    else{
        console.log( "🌀ERROR : ", _calendar, _duration)
    }
    


}

var setAlarm = (reminderDoc) =>{
    if(reminderDoc.isRecurring){
        channel.send("⏰ Time for " + reminderDoc.name  +"!" );
    }
    else{
        //Destroy
        channel.send("⏰⏰⏰⏰ it's time for " + reminderDoc.name  +"!" );
        reminder.deleteOne({_id: reminderDoc._id});
    }
}


var lineChange = `
`

export var spreadTodo = async ()=>{
    var pages = await notion.getPages( notion.databases["Worklog"] );
    var latest = pages[0];
    notion.spreadItem(latest , 7 ); 

}

export var tweetThat = async ()=>{
    await channel.messages.fetch( {limit:5} ).then(messages =>{

        messages = messages.filter( msg => !msg.author.bot )

        var mediaURL = null; var textBody = null; 

        [ messages.last() , messages.first() ].forEach(
            msg =>{
                if(msg.attachments.size){
                    msg.attachments.forEach(att=>{
                        mediaURL = att.url
                    })
                }
            }
        )
        var textBody = !mediaURL ?  messages.first().content : messages.last().content +lineChange + messages.first().content;
        
        
        var tweetPreview = newEmbed( {title: "💬" ,description : textBody , thumbnail :  mediaURL } )
        
        channel.send({embeds : [tweetPreview] })
         

    })
}
