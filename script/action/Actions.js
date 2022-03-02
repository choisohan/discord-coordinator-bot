import { notion } from "../handlers/notion-handler.js";
import { channel,newEmbed } from "../handlers/discord-handler.js";
import { monday,mmdd } from '../extra/scheduler.js';
//import { reminder } from "../handlers/mongo-handler.js";
import { CronJob } from 'cron'
import 'dotenv/config' // ES6
import { entitiesFilter } from "../handlers/wit-handler.js";
import { allisIn  } from "../extra/compare.js";
import { tweet } from "../handlers/twitter-handler.js";

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

    var BUILD = async ( _container ) =>{
        var allowed = ["to_do", "heading_1","heading_2", "heading_3", "column", "column_list" ]
        var all = _container.body.filter( i => allowed.includes(i.type) )
        all =  await notion.itemFilter( all,  {checked: true } );
        var leftTodo = all.filter(item => item.type == 'to_do' );
        _container.header = _container.header.concat(leftTodo);
        _container.body = all.filter( item => !leftTodo.includes(item) )
        return _container;
    }
    await notion.createNewPage( notion.databases["Worklog"] , BUILD ); 

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
    var reminders = await notion.getPages( notion.databases["Reminders"] );

    //console.log( reminders[0].properties['Cron Time'].formula.string);
    reminders.forEach( reminder => {
        var cronTime = reminder.properties['Cron Time'].formula.string;
        var name = reminder.properties['Name'].title[0].plain_text 
        console.log( "setting alarm for ", cronTime, name)
        
        var job =new CronJob( cronTime , ()=>{ sendAlarm(name );                    
        }, null, null , process.env.TIMEZONE);
        job.start()
    })

}




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
        CAL = _cal; //this is calendar
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



export async function createReminder( _entities){
    // 0. sort
    var entitie = entitiesFilter(_entities); 
    var _agenda = entitie.agenda_entry ? entitie.agenda_entry : "something" ;
    var style = { Name : _agenda }
    if('duration' in entitie){
        //it's recurring task
        style.Unit = Object.keys(entitie.duration)[0] ;
        style.Recurring = Object.values(entitie.duration)[0] ;
    }
    else{
        //it's one time event
        var CAL = getCalendar(entitie.datetime);
        style.Date = CAL.year +"-" + CAL.month +"-"+CAL.day
    }
    
    // 1. add notion
    var page = await notion.createNew( notion.databases["Reminders"] , style ); 
    var cronTime = page.properties['Cron Time'].formula.string ;
    
    // 2. set Cron
    new CronJob( cronTime ,
        ()=>{ sendAlarm( _agenda );},
        null, null , process.env.TIMEZONE).start();

}

export function testRun(){
}




/*
export function createReminder( _entities){
    var entitie = entitiesFilter(_entities); 
    
        
    var _agenda = entitie.agenda_entry ? entitie.agenda_entry : "something" ;
    var _isRecurring = entitie.every ? true : false

    var _calendar = "datetime" in entitie ? getCalendar(entitie.datetime) : null;
    var _duration = "duration" in entitie ? entitie.duration : null ; 

    var _cronTime = _calendar ?  getCronTime(_calendar) : _duration ? getCronTime(_duration) : null;

    if(_cronTime){


        // 1.
        var _newReminder = await notion.createNewPage( notion.databases["Reminders"] , null );
        var _properties = {
            "Name" : _agenda,
            "Cron Time ": _cronTime,
            "Script" : null
        }
        notion.modifyPage( _newReminder , _properties ) ;


        // 2. if it's same day, add cron
        var Days =  parseInt(new Date('2022,2,25') - new Date() ) / (1000 * 60 * 60 * 24) ;
        if (Days > 0 ){
            var job = new CronJob(_cronTime, ()=>{ 
               // setAlarm(doc); 
            }, null, null , process.env.TIMEZONE); 
            job.start();
        } 
        channel.send("I just created the ✨⏰new reminder for you");

        /*
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
*/ 



var sendAlarm = ( message ) =>{
    channel.send("⏰ Time for " + message  +"!" );
}


var lineChange = `
`

export var spreadTodo = async ()=>{
    var pages = await notion.getPages( notion.databases["Worklog"] );
    var latest = pages[0];
    notion.spreadItem(latest , 7 ); 

}

export var tweetThat = async ()=>{

    await channel.messages.fetch( {limit:5} ).then( messages =>{

        // 0. Clean up
        messages = messages.filter( msg => !msg.author.bot );
        var keys = Array.from(messages.keys())
        //delete keys[0]

        // 1. Assign         
        var textBody = messages.get(keys[1]).content.length != 0 ?
                    messages.get(keys[1]).content : messages.get(keys[2]).content;

        var mediaURLs = messages.get(keys[1]).attachments.size ?
                    messages.get(keys[1]).attachments :
                        messages.get(keys[2]).attachments.size ?
                        messages.get(keys[2]).attachments  : null ;

        if(mediaURLs){
            mediaURLs = Array.from( mediaURLs.values() )
            mediaURLs = mediaURLs.map( media => media.attachment )
        }

        // 2. Create Message 
        var tweetPreview = newEmbed( 
            {title: "💬 Your Tweet " ,description : textBody })
        tweetPreview.setImage(mediaURLs[0]);

        channel.send({embeds : [tweetPreview] })
         
        // 3. ⬜ Add checking feature before posting

        
        // 4. Post Tweet
            tweet(text, mediaURLs)

    })
}
