import 'dotenv/config'
import { notion } from "../handlers/notion-handler.js";
import { channel } from "../../bot.js"//"../handlers/discord-handler.js";
import { CronJob } from 'cron'
import { tweet } from "../handlers/twitter-handler.js";
import  weather from 'weather-js';
import { MessageEmbed, MessageButton , MessageActionRow, CommandInteractionOptionResolver} from 'discord.js';
import moment from 'moment';
import pkg from 'puppeteer';
import * as Variable from '../extra/util.js';
import axios from 'axios';
import extractor from 'unfluff'
import {yesEmojies, noEmojies} from './Chat.js'
moment.locale('en-ca')

const  puppeteer  = pkg;
export const yesAction ={}; export const noAction = {};  export const moreAction = {}; 
export const stored = {datas: null , numb: null}; const intervals = [];
var allCrons= []

var now = (DATE) => moment(DATE).tz(process.env.TIMEZONE)
var monday  = (DATE) =>  moment().tz(process.env.TIMEZONE).subtract( DATE.getDay()-1,  'days')
var sunday  = (DATE) =>  moment().tz(process.env.TIMEZONE).add(  7-DATE.getDay(),  'days')
var getDayMondayStart = (MOMENT) => MOMENT.format('d')-1 > 0 ? MOMENT.format('d')-1 : 6
var mmdd = (MOMENT) =>{
    var week = MOMENT.format('L').split('-');
    return week[1] + week[2]
}
var isThisWeek = DATE =>  {
   // console.log( moment(DATE) - sunday(new Date()))
    return moment(DATE)- sunday(new Date())  < 0 
}
//console.log(   "🥨",isThisWeek('2022-03-12' ))

//yes
export async function createNewTask( _entitie ){
    try{

        yesAction["createNewTask"] = async () =>{
            if(  'datetime' in _entitie  && isThisWeek(new Date(_entitie.datetime)) ){ // 1-A : this will create on today's log
                var worklog = await getTodaysWorklog();
                var columns = await notion.getColumns( worklog );
                var day = getDayMondayStart ( moment(_entitie.datetime )) 
                var block = {
                    object:'block',
                    type : 'to_do',
                    to_do : {text :[{type : 'text', text : {content: _entitie.agenda_entry }} ]  }
                }
                await notion.appendChild( columns.at(day) , [block]  );    

                var _embed = new MessageEmbed();
                 _embed.setDescription(`The new tasks [${ _entitie.agenda_entry }](${worklog.url}) on this week`)
                return { embeds : [_embed] } ;    
            }
            else{   // 1-B : this will create on tasks database
                var style ={ Name : _entitie.agenda_entry , Group: "Task" }
                if('datetime' in _entitie ){
                    style.Date= {start : new moment( _entitie.datetime ) }
                }
                var newPage = await notion.createNew(process.env.NOTION_DB_ID, style, null); 
                notion.datas.push(newPage)
                var _embed = new MessageEmbed();
                _embed.setDescription(`The new tasks [${ _entitie.agenda_entry }](${newPage.url})`)
                return { embeds : [_embed] } ;
            }
        }
        
        // 0. send this first
        return `Do you want me to add this ${_entitie.agenda_entry} as a new task?`

    }catch(error){
        return "Something went wrong " + error.message
    }

}

//inspectMode
export async function inspectOldTasks(_entitie){

        var worklog = await getTodaysWorklog();
        var columns = await notion.getColumns( worklog );
        var today = getDayMondayStart(now(new Date));

        var tasks = notion.datas.filter( data => notion.groupFilter(data, "Task") )
        tasks = tasks.reverse();
    
        var items = []; 
        //var deleteItems = []; 

        
        stored.numb = 0 ; 
        var ask = () => {
            stored.numb += 1; 
            var _name = tasks[stored.numb].properties.Name.title[0].plain_text;
            return `How about doing ${_name}?`
        }
        
        ask(); 

        moreAction["inspectOldTasks"] = _entitie =>{
            //channel.send(" - ");
            return ask();
        }

        noAction["inspectOldTasks"] = _entitie =>{
            return ask();
        }
        
        yesAction["inspectOldTasks"] = async _entitie =>{
            if( ["perfect","that","awesome"].includes( _entitie.yes.substring() ) ){
                // 0. Add new blocks
                var names = items.map( item => item.Name.title[0].plain_text )
                var blocks = names.map( item =>{return {
                    object:'block',
                    type : 'to_do',
                    to_do : {text :[{type : 'text', text : {content: item }} ]  }
                }})
                await notion.appendChild( columns.at(today) , blocks  );    
                // 1. Remove original blocks
                items.forEach(item=>{
                    deleteItem(item.id)
                })

                // 2. send message
                var _embed = new MessageEmbed();
                _embed.setDescription(  Variable.arrayToString2(names) );
                channel.send(`I just moved ${items.length} tasks to your [${worklog.properties.Name.title[0].plain_text}](${worklog.url})`)
                return {embeds : [_embed] }
            }
            else{
                channel.send(" + ");
                items.push( tasks[stored.numb] ); //add
                return ask();
            }
        }
}


export async function fromLogToTasks(){
    try{
        var worklog = await getTodaysWorklog();
        var columns = await notion.getColumns( worklog );
       var today = getDayMondayStart(now(new Date));
        var TodaysColumn = columns[today];
        var blocks = await notion.getChildren( TodaysColumn, {type:'to_do'} );
        blocks = blocks.filter( b => !b.to_do.checked )
    
        blocks.forEach( async b =>{
            var style =  { Name: b.to_do.text[0].plain_text ,Group:"Task"}
            await notion.createNew( process.env.NOTION_DB_ID , style , null )
            await notion.deleteItem(b.id)
        })
        return "I just moved today's left tasks to [Tasks]" 


    }catch(err){
        return "Something went wrong with fromLogToTasks():" + err.message
    }

}





export var CreateNewLog = async () =>{
    try{
        var BUILD = async ( _container ) =>{
            var allowed = ["to_do", "heading_1","heading_2", "heading_3", "column", "column_list" ]
            var all = _container.body.filter( i => allowed.includes(i.type) )
            all =  await notion.itemFilter( all,  {checked: true } );
            var leftTodo = all.filter(item => item.type == 'to_do' );
            _container.header = _container.header.concat(leftTodo);
            _container.body = all.filter( item => !leftTodo.includes(item) ) 
            return _container;
        }
    
        var style = { Name : mmdd( monday(new Date())) , Group : 'Log', icon : '📙'}
        style.Date = {start : monday(new Date()).format('L') ,end : sunday(new Date()).format('L') }

        yesAction["CreateNewLog"] = async() =>{
            var newPage =  await notion.createNew( process.env.NOTION_DB_ID, style ,BUILD ); 
            notion.datas.push(newPage)
           // if( newPage.children.length > 0 ){await notion.spreadItem( newPage , 7 );}
            
            channel.send(`Here it is!`) 
            var _embed = new MessageEmbed()
            _embed.setDescription(` [📒${style.Name}](${newPage.url}) `);
            return {embeds : [_embed] }
        }
        
        return `Do you want me to create new 📒log?`
        

    }catch(error){
        return "Something went wrong 👉",error.message
    }

    
}

export async function clearChannel(){
    Promise.resolve( await channel.messages.fetch({limit: 100}) )
      .then( fetched =>{
        channel.bulkDelete(fetched);
        //channel.send(`Awesome New Beginning❤️`)
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


export async function initCrons( pages ){

    pages = pages.filter( d => d.properties.Unit.select == null || ['minute','hour','day'].includes(d.properties.Unit.select.name)    )
    pages.forEach(  async reminder => {
        //var repeat = reminder.properties.Reapeat["multi_select"].map( r => r.name)
       // console.log(repeat)
        var cronTime = reminder.properties['Cron Time'].formula.string;
        var cron = new CronJob( cronTime , async function(){
            await sendNotification(reminder.id) 
        } , null, null , process.env.TIMEZONE);
        allCrons.push(cron);
        cron.start(); 
    })
}

export async function restartCron(){
    allCrons.forEach( cron => cron.stop())
    allCrons = [] 
    var reminders = await notion.datas.filter( data => notion.groupFilter(data,"Reminder" ) )
    const currentHour = moment().tz(process.env.TIMEZONE).format('H');
    const isDaytime = currentHour <= 23 && currentHour >= 9;
    if( isDaytime ){ initCrons(reminders); }
}

async function sendNotification(page_id){
    var page = await notion.getPageById(page_id)
    var name = page.properties['Name'].title[0].plain_text 
    var blocks = await notion.getChildren( page );
    blocks = blocks.map( block => {
        return {  [block.type]:
            block.type =="image" ? block[block.type].external.url :
            block.type =="video" ? block[block.type].external.url :
            block[block.type].text.map( item => item.plain_text)[0]  }})
                                .filter( block => Object.values(block)[0] != undefined )

    var scripts = blocks.filter( block => Object.keys(block)[0] == "callout"  )
    var messages = blocks.filter( block => !scripts.includes(block))
    scripts = scripts.map( block => Object.values(block)[0] )
    messages = messages.map( block => Object.values(block)[0] )
    var message = messages.length > 0 ? messages[ Math.floor( messages.length * Math.random() )]  :  "it's time for "+ name +" ✨"
    channel.send( message );

    if(scripts.length >0 ){
        await eval(scripts[0])
    }


    //intervals.push(setInterval(sendMessage, 3000 ))
    
}

export async function respondYes( _entitie, _id ){
    console.log("YES")
    if (_id){
        try{
            var respond = await yesAction[_id](_entitie) ;
            return respond; 
        }catch(err){
            return "Sorry, I fell asleep. What do you want?"
        }  
    }
    else{
        var arr = Object.values(yesAction);
        if( arr.length > 0 ){
            return await arr.at(-1)(_entitie);
        }
        else{
            return yesEmojies[Math.floor(Math.random() * yesEmojies.length )]
        }
    }

}
export async function respondNo( _entitie , _id ){
    console.log("NO")
    if (_id){
        try{
            var respond = await noAction[_id](_entitie) ;
            return respond; 
        }catch(err){
            return "Sorry, I fell asleep. What do you want?"
        }  
    }
    else{
        var arr = Object.values(noAction);
        if( arr.length > 0 ){
            return arr.at(-1);
        }
        else{
            return noEmojies[Math.floor(Math.random() * noEmojies.length )]
        }
    }

}
// Repeating Action
export async function requestMore(_entitie){
    try{
        const latestMore = Object.values(moreAction)[0]
        return latestMore(_entitie)
    }catch(err){

    }
}

export async function requestStop(_entitie){
    yesAction={}, noAction= {} , moreAction ={}
    return "No problem!"
}

export async function createReminder(entitie){

    // 0. sort
    var _agenda = entitie.agenda_entry ? entitie.agenda_entry : "something" ;
    var style = { Name : _agenda , Group: 'Reminder' , icon: "🔔"};
    if('duration' in entitie){
        //it's recurring task
        style.Unit = Object.keys(entitie.duration)[0] ;
        style.Recurring = Object.values(entitie.duration)[0] ;
        console.log( style.Recurring )
    }
    if('datetime' in entitie ){
        //it's one time event
        var CAL = getCalendar(entitie.datetime);
        console.log(CAL)
       // style.Date = {start : CAL.year +"-" + CAL.month +"-"+CAL.day , end: null }
       style.Date = {start : entitie.datetime , end: null }
        //console.log(CAL , style.Date )
    }

    yesAction["createReminder"] = async() =>{
        
        // 1. add notion
        var page = await notion.createNew( process.env.NOTION_DB_ID , style ,null ); 
        notion.datas.push(page)
        var cronTime = await page.properties['Cron Time'].formula.string ;
   
        // 2. set Cron
        var newCron = new CronJob(cronTime ,()=>{
            channel.send( _agenda )
        },null, null , process.env.TIMEZONE);
        allCrons.push(newCron);
        newCron.start();
        const _embed =  new MessageEmbed().setDescription(`[🔔${_agenda}](${page.url})`)
        channel.send({embeds : [_embed] })
        return "I added a new reminder for you!"
    }
    // 1. check up message
    var _embed = new MessageEmbed();
    _embed.setTitle("🔔New Reminder");
    var text;
    if('duration' in entitie){
        text = `${ style.Name } : every ${ style.Recurring.toString()+' ' + style.Unit.toString()  } `
    }
    if('datetime' in entitie){
        text = `I can remind you on ${ style.Date.start  } for ${ style.Name }`
    }
    _embed.setDescription(text);
    
    channel.send("Want me to create like this?")
    return {embeds : [_embed] }

}


export var tellMeAboutReminders = async () =>{
    try{
        // 1. get
        var reminders = await notion.datas.filter( data => notion.groupFilter(data,"Reminder" ) )
        reminders = reminders.map( item => {
            return {  Name : item.properties.Name.title[0].plain_text,
                Date : item.properties.Date.date ? item.properties.Date.date.start : null ,
                Recurring : item.properties.Recurring ? item.properties.Recurring.number : null ,
                Unit : item.properties.Unit.select ? item.properties.Unit.select.name   : null ,
                URL : item.url,
                id: item.id,
                cronTime: item.properties['Cron Time'].formula.string
            }
        
        })

        // 2. Create Message 
        var _embed = new MessageEmbed;
        _embed.setTitle("⏰ All Reminders")
        var _arr = [] 
                    
        for( var i = 0 ; i < reminders.length ; i ++ ){
            //var _time = reminders[i].Date;
            //var _name = reminders[i].Name
            //_embed.addFields({ name : _name , value : `[ ${i}. ${reminders[i].cronTime} ](${reminders[i].URL} )` } )
            _arr.push(`[ ${reminders[i].Name} ](${reminders[i].URL} )    ${reminders[i].cronTime} `)
        }
        _embed.setDescription(await Variable.arrayToString2(_arr) ); 

        stored.datas = reminders; 
        return {embeds : [_embed] };

    }catch(err){
        return err.message
    }

}

// ⬜ Need Update
export var deleteSelected = async ( _entities ) =>{

    if( !stored.datas ){
        channel.send("hmmm.... delete from where? 😗❔ ")
    }

    else{
        channel.send("I can delete if you want!")
        yesAction["tellMeAboutReminders"] = async () =>{
            var numbers = _entities['number']
            numbers = numbers.map( numb => numb.value )
            for (var i = 0; i < numbers.length ; i ++  ){
                var ID = numbers[i]
                ID= stored.datas[ID].id 
                await notion.deleteItem(  ID  )
            }
            channel.send( 'Mission Complete! I deleted ' + numbers.length + "  items 🙌" ) 
        }

    }
    
}


var lineChange = `
`

/*
export var spreadTodo = async ()=>{
    var pages = await notion.getPages( notion.databases["Worklog"] );
    var latest = pages[0];
    notion.spreadItem(latest , 7 ); 
}*/ 

export var tweetThat = async ( textBody , mediaURLs ) =>{
    if(!textBody){
        await channel.messages.fetch( {limit:5} ).then( messages =>{
            // 0. Clean up
            messages = messages.filter( msg => !msg.author.bot );
            var keys = Array.from(messages.keys())
    
            // 1. Assign         
            textBody = messages.get(keys[1]).content.length != 0 ?
                        messages.get(keys[1]).content : messages.get(keys[2]).content;
    
            mediaURLs = messages.get(keys[1]).attachments.size ?
                            messages.get(keys[1]).attachments :
                            messages.get(keys[2]).attachments.size ?
                            messages.get(keys[2]).attachments  : new Map() ;
             
            if( mediaURLs.size > 0 ){
                mediaURLs = Array.from( mediaURLs.values() )
                mediaURLs = mediaURLs.map( media => media.attachment )}    
        })

    }

    // 2. set Post Tweet
    yesAction["tweetThat"] = () =>{
        tweet( textBody, mediaURLs )
    }
    // 2. Create Message 
    var _embed = new MessageEmbed().setTitle("💬 Your Tweet ")
                                    .setDescription(textBody);
    
    if(mediaURLs){_embed.setImage(mediaURLs[0])}
    return {embeds : [_embed] }

}

//https://github.com/devfacet/weather
export function getWeather( _embeded , _city ){
    return new Promise(async (resolve,error)=>{
        weather.find({search: _city, degreeType: 'F'}, function(err, result) {
            var data = result[0];
            _embeded
                .setThumbnail(data.current.imageUrl)
                .addField("Sky Condition", data.current.skytext, true)
                .addField("Temperature", data.current.temperature, true)
                .addField("Day", data.current.day, true)
                resolve(_embeded)
          });      
    })
}

var witTimeToDate = _witTime =>{
    return new Date(_witTime.split('T')[0].replace('-',','))
}

export var TellMeAboutTasks = async (_entitie) =>{
    try{
        var date = 'datetime' in _entitie ? witTimeToDate(_entitie.datetime) : new Date()
        var day =  moment().tz(process.env.TIMEZONE).format('d')
        day = day == 0 ? 6: day - 1;  //start of the week is monday
    
        var worklog = await getTodaysWorklog();
        var columns = await notion.getColumns( worklog ) ; 
        
        var [allTodo, leftTodo] = await getTasks(day,columns ) 
        var text = "" ; 
        var _newEmbed = await new MessageEmbed();
        _newEmbed.setTitle (  "🌈 " + date.toDateString()  ); 
        if("how_many" in _entitie){
            text = "You have  " + leftTodo.length.toString() +"/" + allTodo.length.toString() +" tasks" ;
        }
        else{
            stored.datas = await !"remain" in _entitie ? allTodo : leftTodo ;
            text = await notion.blocks_to_text( stored.datas );  
        }
        text += lineChange += `[📙${worklog.properties.Name.title[0].plain_text}](${worklog.url})`
        _newEmbed.setDescription( text ); 
        var nextColumn = columns[Math.min(day + 1, columns.length)]
        askBusy( 10 ,leftTodo , nextColumn ); 
        return {embeds : [_newEmbed] }
        
    }catch(error){
        return "😧Something went wrong "+ error.message
    }


}

var getTasks = async( day , columns ) =>{
    //var columns = await notion.getColumns( page );
    var TodaysColumn = columns[day]; 
    var allTodo = await notion.getChildren( TodaysColumn, {type:'to_do'} );
    allTodo = await allTodo.filter(b => b.to_do )
    var leftTodo = await allTodo.filter( b => !b.to_do.checked );
    return [allTodo, leftTodo]; 
}



var notionDateToDate = (stringDate) =>{
    var Cal = stringDate.split("-").map(i => parseInt(i) )
    return new Date(Cal[0], Cal[1]-1, Cal[2]); // ⬜ month number seems larger...
}


export var TellMeAboutProject = async (_entitie)=>{
    try{
        var AllProjects = await notion.datas.filter( data => notion.groupFilter(data,"Project" ) )
        var Now = new Date()//now(new Date()) //timezone(new Date())
        var Scheduled = AllProjects.filter( p => p.properties.Date.date != null && p.properties.Date.date.end != null )
        var Completed = Scheduled.filter( p => Now.getTime() >= notionDateToDate(p.properties.Date.date.end).getTime() )
    
        var Incompleted = Scheduled.filter( p => !Completed.includes(p));
    
        var Project ; 
        if ('next' in _entitie ){
            Project = Incompleted[1] 
        }
        else if ( 'previous' in _entitie ){
            Project = Completed.at(-1)
        }
        else{
            Project = Incompleted[0] 
        }
    
        if( Project ){
            //found
            var title = Project.properties.Name.title[0].plain_text; 
            var start = Project.properties.Date.date.start; 
            var end = Project.properties.Date.date.end; 
            //var Now = now(new Date())
            var leftDays =  Math.floor( (notionDateToDate(end) - new Date() )/(1000 * 60 * 60 * 24) );
            leftDays = leftDays < 2 ? leftDays.toString() +" day" :leftDays.toString() +" days"
            
            var _embeded = new MessageEmbed()
            _embeded.setDescription(`[ 🏞️ **${title}** ](${Project.url})`)
            var text =[]
            
            if('next' in _entitie){
                const startIn = moment(start).endOf('day').fromNow();
                text.push("◽ Start in " + startIn)
            }
            else if ( 'previous' in _entitie ){
                text.push("◽ Started " + start )
                text.push("◽ Due is " + end )
            }
            else{
                text.push("◽ Due is " + leftDays + lineChange)
    
                //_embeded.addFields({name :'⭐Left' , value : leftDays, inline : true })
            }
    
           var Text = ''
           for(var i = 0; i < text.length; i++){
                Text += text[i];
               if( i != text.length ){    Text+= lineChange; }
           }
    
            _embeded.addFields({name :'Information' , value : Text })
            return {embeds : [_embeded] }
        }
        else{
            return (
    `You don't have any specific project assigned!
    Do anything you like!❤`)
        }

    }catch(err){
        return err.message
    }

 

}




export async function TellMeAboutLocation(_entitie){
    var location = "location" in _entitie ? _entitie.location.name : "Vancouver"
    
    // 1. Create Embed
    var _newEmbed = new MessageEmbed();
    _newEmbed.setTitle( "🗺️ " + location );

    if( "time" in _entitie ){
        var requestTime = new Date();
        var localTime = moment.tz( requestTime , _entitie.location.timezone ).format('LT');
        _newEmbed.setFields({name : "Local Time", value : localTime} )
    }
    
    if("weather" in _entitie){
        _newEmbed = await getWeather(_newEmbed , location ); 
    }

    // 2. Send
    if(!_newEmbed.description &&  !_newEmbed.fields ){}
    else{ return {embeds : [_newEmbed] }}

}

export async function getGIF(search_term){
    return new Promise(async (resolve, err)=>{
        var url = `http://api.giphy.com/v1/gifs/search?q=${search_term}&api_key=${process.env.GIPHY_KEY}&limit=10`
        fetch(url)
            .then( response =>response.json())
            .then(content => {
                var rand = Math.floor(content.data.length * Math.random())
                var imgURL = content.data[rand].images.downsized.url;
                resolve(imgURL)
        })
    })
}

export async function getRecipe(_keywords){
    console.log( "🌿" )
    var _keyword = _keywords ? _keywords : "healthy"
    var URL = 'https://tasty.co/search?q='+_keyword+'&sort=popular'
    var _selector ='.feed-item__img-wrapper';
    
    moreAction["getRecipe"] = async ()=> {
        

        const browser = await puppeteer.launch({
            args: ['--no-sandbox','--disable-setuid-sandbox']
          })
        const page = await browser.newPage();
        await page.goto(URL, {waitUntil: 'networkidle2'});

        var contents = await page.$$(_selector);
        var random = contents[Math.floor(contents.length * Math.random())]
        var alink = await random.getProperty('parentNode')
        alink = await alink.getProperty("href");
        alink =  alink._remoteObject.value

        await page.goto( alink,{waitUntil: 'networkidle2'})

        const recipe = {}; 

        recipe.ingredients = await page.$$eval('.ingredient', el => el.map( el=> el.textContent)  )
        recipe.ingredients = Variable.arrayToString(recipe.ingredients)
        
        recipe.instruction = await page.$$eval('.xs-mb2', els =>  {
            return els.filter( el => el.classList.length == 1 )
                .map(el=> el.textContent)
        })
        recipe.instruction = recipe.instruction.slice(recipe.instruction.length/2)
        recipe.instruction = Variable.arrayToString2(recipe.instruction)

        recipe.thumbnail = await page.$eval('.video-js',el => el.getAttribute('poster') )
        recipe.video = await page.$eval('source',el => el.src )    
        await browser.close; 

        // Send
        var _embeded = new MessageEmbed().setTitle(` 👩‍🍳💘 Recipe of Love `)
        _embeded.setImage( recipe.thumbnail ); 
        _embeded.addFields( {name :"ingredients" , value : recipe.ingredients , inline:true  })
        _embeded.addFields( {name :"instruction" , value : recipe.instruction  , inline:true })
        channel.send(recipe.video);
        return {embeds : [_embeded] }
    }
    try{
        return moreAction["getRecipe"]();
    }catch(error){
        return "Something went wrong with.. "+ error.message
    }

}

export async function TellMeAboutSocialStat(_entitie){
    return 'Sorry, This feature is not available'
    /*
    try{
 
        var stats = {}
        
        const browser = await puppeteer.launch({
            args: ['--no-sandbox','--disable-setuid-sandbox']
          })
        const page = await browser.newPage();
    
        var URL = 'https://www.instagram.com/happping_min/'
        const navigationPromise = page.waitForNavigation({waitUntil: "domcontentloaded"});
        await page.goto(URL,{  
            waitUntil: "load",  
            timeout: 0,  // Remove the timeout  
           });
        await page.screenshot({ path: 'temp/tmp_1.png' })
        await navigationPromise;
        await page.waitForSelector('.Y8-fY'  ); //,  { timeout: 6000 }
        stats.instagram = await page.$$eval('.Y8-fY', els => els.map(el => el.textContent ) ); //posts, followers, following
        //stats.instagram = stats.instagram[1];
        console.log("🍝stats", stats )
        
        
        //⬜ tiwtter not working now

        var URL = 'https://twitter.com/happping_min'
        console.log("💛URL", URL )
        await page.goto(URL);
        await navigationPromise; 
           // await page.waitForSelector('.css-4rbku'); 
        //stats.twitter = await page.$$eval('.css-4rbku5', els => els.map(el => el.textContent ).filter(el => el.includes("Followers") ) );
        //stats.twitter = stats.twitter[0]
    
        var _embeded = new MessageEmbed()
        Object.keys(stats).forEach(key =>{
            if(stats[key]){
                _embeded.addFields( {name :`❤️${key}` , value : stats[key]  })
            }
        })
        await browser.close; 
        return {embeds : [_embeded] }


    }catch(err){
        return err.message
    }
    */ 

}


export async function getTodaysWorklog(){
    return new Promise(async (resolve,error)=>{
        var worklogs = await notion.datas.filter( data => notion.groupFilter(data,"Log" ) )
        var start = notionDateToDate(worklogs[0].properties.Date.date.start);
        var end = notionDateToDate(worklogs[0].properties.Date.date.end);
        var Now = new Date()//now(new Date());
        
        if( Now.getTime() <= end.getTime() && Now.getTime() >= start.getTime()   ){
            resolve(worklogs[0]);
        }
        else{
            channel.send("There are no worklog for this week."); 
            CreateNewLog(); 
        }
    })
}


//|| isThisWeek(new Date(t.properties["Last Added"].date.start))

export async function botIn(){
    channel.send("Hey I came back!❤️")
    restartCron()
    intervals.push( setInterval( ()=>{restartCron()} , 1000 * 60 * 60)  ) //every 1 hour reset
    //userIn()
    //send("can you remind me every 1 hour?")
   // const currentHour = moment().tz(process.env.TIMEZONE).format('H');
   // console.log(currentHour )

}

async function addScheduledTasks( columns, day ){
    var tasks = await notion.datas.filter(data => notion.groupFilter(data,"Task") )
    tasks = tasks.filter( t => t.properties['Next Date'].formula.date != null )
    tasks = tasks.filter ( t => isThisWeek(new Date( t.properties['Next Date'].formula.date.start) )  )

    for(var i = day; i < 7; i++){
        var Tasks_of_the_day = tasks.filter( t =>{
            if( t.properties.Unit.select != null && t.properties.Unit.select.name =="day"   ){  return true;    }
            else{   return getDayMondayStart(moment(t.properties['Next Date'].formula.date.start)) == i  }
        })

        var Tasks_on_the_log = await notion.getChildren( columns[i] )
        Tasks_on_the_log = await Tasks_on_the_log.filter(t => t.type =="to_do" && t["to_do"].text.length > 0 ).map( t=> t["to_do"].text[0].plain_text)
        
        Tasks_of_the_day = Tasks_of_the_day.filter( t=> !Tasks_on_the_log.includes( t.properties.Name.title[0].plain_text ))

        if( Tasks_of_the_day.length > 0 ){
            var blocks = Tasks_of_the_day.map( t =>{return {
                object:'block',
                type : 'to_do',
                to_do : {text :[{type : 'text', text : {content: t.properties.Name.title[0].plain_text }} ]  }
            }}) 
            await notion.appendChild( columns[i] , blocks );

            Tasks_of_the_day.forEach(t =>{
                if(t.properties.Unit.select == null){ // not repeating task will be delete
                    console.log("Delete" , t.properties.Name.title[0].plain_text )
                    notion.deleteItem(t.id)
                }
            })
        }
    }
}

export async function userIn(){

    try{

    
         // 1. Random Message 
        var messages = ['Hello!','You came back!',"Hey Darling!"];  
        channel.send( messages[Math.floor( Math.random() * messages.length )]);

        // 2. Create Today's log
        var _embed = new MessageEmbed()
        _embed.setTitle(` ♥ Let's start Today `)
        _embed = await getWeather( _embed , 'Vancouver, BC');

        var worklog = await getTodaysWorklog(); 
        var columns = await notion.getColumns( worklog ) ; //page
        var day = moment().tz(process.env.TIMEZONE).format('d')
        //new Date().getDay()
        day = day == 0 ? 6: day - 1; 
        console.log(day)
        addScheduledTasks( columns, day ); 

        var [allTodo , leftTodo] =  await getTasks(day, columns ) ;
        var todos = await notion.blocks_to_text(allTodo);     
        _embed.addFields({name : "Tasks", value : todos})
        _embed.addFields({name : "Count", value : `${allTodo.length-leftTodo.length}/${allTodo.length}`})
    
        // 9. if task is too many
        var nextColumn = columns[Math.min(day + 1, columns.length)]
        askBusy(10, leftTodo , nextColumn );       
        return { embeds : [ _embed] }
        
    }catch(error){
        return "Something went wrong 👉"+ error.message
    }
}

export async function userOut(){
    var messages = ["Bye! Have a good day!" ,"See ya!"]
    allCrons.forEach( cron => { cron.stop() })
    intervals.forEach( interval => clearInterval(interval) )
    return messages[Math.floor( Math.random() * messages.length )]
}


async function askBusy( _maxCount , tasks , moveGoal ){
    if( tasks.length > _maxCount ){
        const messages = [`😲You are too busy today!
Do you want me to move some tasks to tmr?`];
        var leftArr = tasks.slice(_maxCount) ;
        yesAction["askBusy"] = async() =>{
            leftArr.forEach(async task =>{
                try{
                    await notion.parent( task, moveGoal )
                }catch(error){
                    return`🤷🏽‍♀️ Something went wrong. 👉${error.message}`
                }
            })
            channel.send('Yay! You have less tasks for today now!')
        }
        channel.send( messages[Math.floor( messages.length * Math.random() )]) 
    }
    else if( tasks.length < 4 ){
        var TASKS_URL = `https://www.notion.so/happpingmin/30ddc8bbffcc481cb702da35789f3cf5?v=f6894f5cc1d246a0b49179d270748e2e`
        channel.send(`You seems like free, check out Tasks Page`)
        channel.send({embeds : [new MessageEmbed().setDescription(`[Tasks](${TASKS_URL})`) ]})
    }
}

export async function SearchDictionary( mm, entitie , traits ){

    try{
        var myDictionaries = await notion.datas.filter( data => notion.groupFilter(data,"Dictionary" ) )
        var myDictionary = myDictionaries[0]
    
        var Headers = await notion.getChildren( myDictionary );
        Headers = Headers.filter( header => header[header.type].text.length > 0 && header.has_children )
        var searchThese =[];
        Object.values(entitie).forEach( text => text.toLowerCase().split(" ").forEach( t => searchThese.push(t) ))
        Headers =  Headers.filter( header =>{
            var header_keywords = header[header.type].text[0].plain_text.split(" ").map( text => text.toLowerCase() );
            return Variable.anyisIn(searchThese , header_keywords ); 
        })
        
        if( Headers.length > 0 ){
            // 0. get random item
            var header = Headers[Math.floor( Headers.length * Math.random() )]
            var children = await notion.getChildren( header ); 
            // 1. get random children
            var ChildBlock = children[Math.floor( children.length * Math.random() )]
            var textElements =  ChildBlock[ChildBlock.type].text ;//.map(b => b.text)

            if(textElements.length == 1 ){
                return textElements[0].plain_text
            }
            else{
                textElements = textElements.map( text => {
                    if(text.href){ return `[${text.plain_text}](${text.href})` }
                    else{ return text.plain_text}
                } )
        
                var foundInfo = ""
                textElements.forEach(text => foundInfo += text )
                
                // 2. Send
                
                var _embed = await new MessageEmbed();
                _embed.setTitle(header[header.type].text[0].plain_text);
                _embed.setDescription(  foundInfo  );
                channel.send('Maybe check this out?')
                return {embeds : [_embed] }
            }

        }

        else if( "emotion" in entitie || Variable.anyisIn(["positive","negative"], Object.values(traits))){
            return await getGIF( mm )
        }

    }catch(err){
        channel.send("Something went wrong on SearchDictionary()")
        return (err.message)
    }  
}

export async function SearchGoogle(mm){
    try{
        var URL = "https://www.google.com/search?q=" + mm ;
        const browser = await puppeteer.launch({
            args: ['--no-sandbox','--disable-setuid-sandbox']
          })
        const page = await browser.newPage();
        await page.goto(URL, {waitUntil: 'networkidle2'});
        var classList = ['.V3FYCf','.hgKElc','.hb8SAc']
        var explain = "" ; var i = 0; 
        do{
            var el = await page.$(classList[i])
            if(el){explain = await el.evaluate(el=>el.textContent )}
            i++;
        }while( explain == "" )

        var _embed = await new MessageEmbed();
        if(explain.length > 0){
            explain += lineChange + `[Link](${page._target._targetInfo.url})`
            _embed.setTitle (  "😎 " + mm  ); 
            _embed.setDescription(explain);
        }
        else{
            _embed.setDescription(`[Link](${page._target._targetInfo.url})`);
        }
        await browser.close; 
        return {embeds : [_embed] }; 
    }catch(err){
        channel.send(err.message)
        return "Hmmmm.. Something went wrong on SearchGoogle()";
    }
}


export async function ReadSlowly( URL ){
    var data = await axios.get(URL).then( res => {
        return extractor.lazy(res.data) 
    })
    var texts = data.text().split(lineChange).filter( t => t!= '').map(t => t.split('.'))
    var ArticleBody = []
    if( data.image() ){ ArticleBody.push(data.image()) }
    texts.forEach( text =>{ text.forEach(t => ArticleBody.push(t))})
    ArticleBody = ArticleBody.filter(t=>  t.length > 0 )
    if(ArticleBody.length >  0 ){
        var i = 0; 
        yesAction['ReadSlowly'] = () =>{
            const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('ReadSlowly')
					.setLabel('Next')
					.setStyle('SUCCESS'),
			);

            var content = {content : ArticleBody[i] }

            i += 1;

            if( i == ArticleBody.length){
                channel.send("Article is finished")
                delete yesAction['ReadSlowly']
            }
            else{
                content.components = [row]
            }
            return content;
        }
        return yesAction['ReadSlowly']()
    }
    else{
        return "hm... I can't fetch article body"
    }
}

export async function helpEnglish(_word){
    var _embed = new MessageEmbed();
    var URL= "";  var text = ``
    const browser = await puppeteer.launch({
        args: ['--no-sandbox','--disable-setuid-sandbox']
      })
    const page = await browser.newPage();

    // 0. Get Meaning
    try{
        URL = `https://dic.daum.net/search.do?q=${_word}&dic=eng`
        await page.goto(URL, {waitUntil: 'networkidle2'});
        await page.waitForSelector('.list_mean'); 
        var meaning = await page.$eval('.list_mean', el=> el.textContent.trim()  )
        if(meaning==""){
            _word = await page.$eval('.link_speller', el=> el.textContent)
            URL = `https://dic.daum.net/search.do?q=${_word}&dic=eng`
            await page.goto(URL, {waitUntil: 'networkidle2'});
            await page.waitForSelector('.list_mean'); 
            meaning = await page.$eval('.list_mean', el=> el.textContent.trim()  )
        }
        //await page.screenshot({ path: 'temp/tmp_1.png' })
        text += `**[${_word}](${URL})**\n`
        text += meaning;
    }catch(err){
        channel.send("Sorry, I am having trouble with a Dictionary😭 ", err.message)
    }

    // 1. Get Synonyms
    try{
        URL = 'https://www.thesaurus.com/browse/' + _word
        await page.goto( URL, {waitUntil: 'networkidle2'});
        var synonym = await page.$$eval(".css-1kg1yv8", els =>els.map(el => el.textContent) );
        text += `\n`+ synonym 
    }catch(err){
        channel.send("Sorry, I am having trouble with Saurus😭", err.message)
    }
    await browser.close; 

    _embed.setDescription(text)
    return {embeds : [_embed] }; 
}
 
