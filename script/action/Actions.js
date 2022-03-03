import 'dotenv/config'
import { notion } from "../handlers/notion-handler.js";
import { channel,newEmbed } from "../handlers/discord-handler.js";
import { monday,mmdd } from '../extra/scheduler.js';
import { CronJob } from 'cron'
import { entitiesFilter } from "../handlers/wit-handler.js";
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
        await notion.createNew( notion.databases["Tasks"] , {Name: b.to_do.text[0].plain_text} , null )
        await notion.deleteItem(b.id)
    })
    var text = "I just moved today's left tasks to [Tasks]" 
    channel.send(text)
}

var getNotionDate = _date=>{ return _date.toISOString().split('T')[0] }
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

    var style = { Name : mmdd(monday) }
    style.Date = {start :getNotionDate(monday)  }
    
    var newPage =  await notion.createNew( notion.databases["Worklog"] , style ,BUILD ); 
    if( newPage.children.length > 0 ){await notion.spreadItem( newPage , 7 );}
    
    channel.send(`Here it is!`) 
    var _newEmbed = newEmbed( {description :` [📒${mmdd(monday)}](${newPage.url}) `} )
    channel.send({embeds : [_newEmbed] })
    
    
}

export async function clearChannel(){
    Promise.resolve( await channel.messages.fetch({limit: 100}) )
      .then( fetched =>{
        channel.bulkDelete(fetched);
        channel.send(`Awesome New Beginning❤️`)
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

export async function reminderInit(){
    var reminders = await notion.getPages( notion.databases["Reminders"] );

    //console.log( reminders[0].properties['Cron Time'].formula.string);
    reminders.forEach( reminder => {
        var cronTime = reminder.properties['Cron Time'].formula.string;
        var name = reminder.properties['Name'].title[0].plain_text 
        
        var job =new CronJob( cronTime , ()=>{ sendAlarm(name );                    
        }, null, null , process.env.TIMEZONE);
        job.start()
    })

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
        style.Date = {start : CAL.year +"-" + CAL.month +"-"+CAL.day , end: null }
    }
    
    // 1. add notion
    var page = await notion.createNew( notion.databases["Reminders"] , style ,null ); 
    var cronTime = page.properties['Cron Time'].formula.string ;
    
    // 2. set Cron
    new CronJob( cronTime ,
        ()=>{ sendAlarm( _agenda );},
        null, null , process.env.TIMEZONE).start();

}

export var tellMeAboutReminders = async () =>{
    // 1. get
    var reminders = await notion.getPages( notion.databases["Reminders"] );
    reminders = reminders.map( item => 
            { return  {  Name : item.properties.Name.title[0].plain_text,
                        Date : item.properties.Date.date.start,
                        Recurring : item.properties.Recurring.number,
                        Unit : item.properties.Unit.select ? item.properties.Unit.select.name   : null ,
                        URL : item.url,
                        id: item.id
                    }
            } )
    // 2. Create Message 

    console.log("🍓",reminders )
    
    var _embed = newEmbed({title: "⏰ All Reminders"})
                 
    for( var i = 0 ; i < reminders.length ; i ++ ){
        var _time = reminders[i].Date;
        _embed.addFields({ name : _time , value : `[ ${i}. ${reminders[i].Name} ](${reminders[i].URL} )` } )
    }

    channel.send({embeds : [_embed] })  
    return reminders;
}


export var deleteSelected = async ( _dataDict, _entities ) =>{

    var message = ""
    if( !_dataDict ){message = "hmmm.... delete from where? 😗❔ "}

    else{

        var numbers = _entities['wit$number:number']
        numbers = numbers.map( numb => numb.value )
        for (var i = 0; i < numbers.length ; i ++  ){
            //console.log( "🎗  "+ numb.id  )
            var ID = numbers[i]
            ID= _dataDict[ID].id 
            await notion.deleteItem(  ID  )
        }

        message = 'Mission Complete! I deleted ' + numbers.length + "  items 🙌"
    }
    channel.send(message)
    
    
}

export function testRun(){
}




var sendAlarm = ( message ) =>{channel.send("⏰ Time for " + message  +"!" );}
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
                        messages.get(keys[2]).attachments  : new Map() ;
         
        if( mediaURLs.size > 0 ){
            mediaURLs = Array.from( mediaURLs.values() )
            mediaURLs = mediaURLs.map( media => media.attachment )
        }      

        // 2. Create Message 
        
        var tweetPreview = newEmbed({title: "💬 Your Tweet " ,description : textBody }) ;
        if(mediaURLs){tweetPreview.setImage(mediaURLs[0])}
        channel.send({embeds : [tweetPreview] })
        *
        
        // 3. ⬜ Add checking feature before posting "Like this?"

        
        // 3. Post Tweet
        tweet( textBody, mediaURLs )


    })
}

