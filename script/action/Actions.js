import 'dotenv/config'
import { notion } from "../handlers/notion-handler.js";
import { channel, newEmbed } from "../handlers/discord-handler.js";
import { CronJob } from 'cron'
import { tweet } from "../handlers/twitter-handler.js";
import  weather from 'weather-js';
import { MessageEmbed } from 'discord.js';
import moment from 'moment';
import pkg from 'puppeteer';
import * as Variable from '../extra/util.js';
import axios from 'axios';
moment.locale('en-ca')

const  puppeteer  = pkg;
var stored = {}; var allCrons =[]; var intervals = []; 

var now = (DATE) => moment(DATE) 
var monday  = (DATE) =>  moment().subtract( DATE.getDay()-1,  'days')
var sunday  = (DATE) =>  moment().add(  7-DATE.getDay(),  'days')
var getDayMondayStart = (MOMENT) => MOMENT.format('d')-1 > 0 ? MOMENT.format('d')-1 : 6
var mmdd = (MOMENT) =>{
    var week = MOMENT.format('L').split('-');
    return week[1] + week[2]
}


export async function createNewTask( _name ){
    try{
        var style ={ Name : _name, Group: "Task" }
        var newPage = await notion.createNew(process.env.NOTION_DB_ID, style, null); 
        notion.datas.push(newPage)
        var _newEmbed = new MessageEmbed();
        _newEmbed.setDescription(`✨The new tasks [${_name}](${newPage.url})`)
        channel.send({embeds : [_newEmbed] })
        return task; 
    }catch(error){
        console.log(error )
        channel.send("Something went wrong " + error.message)
    }

}

//inspectMode
export async function inspectOldTasks(_entitie){

        var worklog = await getTodaysWorklog();
        var columns = await notion.getColumns( worklog );
        //var today = timezone( new Date() ).getDay() - 1 ; 
        var today = getDayMondayStart(now(new Date));

        var tasks = notion.datas.filter( data => notion.groupFilter(data, "Task") )
        tasks = tasks.reverse();
    
        var items = []; 
        //var deleteItems = []; 

        
        stored.numb = 0 ; 
        var ask = () => {
            stored.numb+= 1; 
            var _name = tasks[stored.numb].properties.Name.title[0].plain_text;
            channel.send( 'How about doing "' + _name + '"?' );
        }
        
        ask(); 

        stored.moreAction = _entitie =>{
            channel.send(" - ");
            ask();
        }

        stored.noAction = _entitie =>{
            ask();
        }
        
        stored.yesAction = async _entitie =>{
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
                channel.send({embeds : [_embed] })
                channel.send(`I just moved ${items.length} tasks to your [${worklog.properties.Name.title[0].plain_text}](${worklog.url})`)
            }
            else{
                channel.send(" + ");
                ask();
                items.push( tasks[stored.numb] ); //add
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
        var text = "I just moved today's left tasks to [Tasks]" 
        channel.send(text)

    }catch(err){
        channel.send("Something went wrong with fromLogToTasks():" + err.message)
    }

}



export async function translate(){


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
        console.log( style.Date.start )
        
        
        channel.send(`Do you want me to create new 📒log?`)
        
        stored.yesAction = async() =>{
            var newPage =  await notion.createNew( process.env.NOTION_DB_ID, style ,BUILD ); 
            notion.datas.push(newPage)
           // if( newPage.children.length > 0 ){await notion.spreadItem( newPage , 7 );}
            
            channel.send(`Here it is!`) 
            var _newEmbed = newEmbed( {description :` [📒${style.Name}](${newPage.url}) `} )
            channel.send({embeds : [_newEmbed] })
        }
    }catch(error){
        channel.send("Something went wrong 👉",error.message)
    }

    
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


export async function initCrons( pages ){
    pages = pages.filter( d => d.properties.Unit.select == null || ['minute','hour','day'].includes(d.properties.Unit.select.name)    )

        
    pages.forEach(  async reminder => {
        var blocks = await notion.getChildren( reminder );
        blocks = blocks
        .map( block => {return {[block.type]:
            block.type =="image" ? block[block.type].external.url :
            block.type =="video" ? block[block.type].external.url :
            block[block.type].text
                .map( item => item.plain_text)[0]
        }})
        .filter( block => Object.values(block)[0] != undefined )

        // check script is in
        var scripts = blocks.filter( block => Object.keys(block)[0] == "callout"  )
        var messages = blocks.filter( block => !scripts.includes(block))
        messages= messages.map( block => Object.values(block)[0] )
        scripts= scripts.map( block => Object.values(block)[0] )
        var cronTime = reminder.properties['Cron Time'].formula.string;
        var name = reminder.properties['Name'].title[0].plain_text 
        var cron = new CronJob( cronTime , ()=>{
            var message = messages.length > 0 ? messages[ Math.floor( messages.length * Math.random() )]  :  "it's time for "+ name +" ✨"
           var sendMessage = channel.send( message )
           intervals.push(setInterval(sendMessage, 3000 ))

            stored.yesAction = () =>{
                channel.send("Good Job!");
                //clearInterval(interval);

            }
            

            if( scripts.length > 0 ){
                try{
                    eval(scripts[Math.floor( scripts.length * Math.random() )]  )
                }catch(error){
                    console.log( channel.send("🤷🏽‍♀️ Something went wrong. "+ reminder.Name.title[0].plain_text +" : "+ error.message) )
                }                             
            }     
        }, null, null , process.env.TIMEZONE);
        allCrons.push(cron);
        cron.start(); 
    })
}

export async function respondYes(_entitie){
    if( stored.yesAction ){
        stored.yesAction(_entitie);
    }
    else{
        channel.send("Sorry, I fell asleep. What do you want?")
    }
    if( intervals.length > 0 ){
        for ( var INTER in intervals){
            clearInterval(INTER);
            intervals= [];
        }
    }
}
export async function respondNo(_entitie){
    if(stored.noAction){
        stored.noAction(_entitie); 
    }else{
        channel.send("No problem!👍")
    }
}
// Repeating Action
export async function requestMore(_entitie){
    if(stored.moreAction){
        stored.moreAction(_entitie);
    }
}

export async function requestStop(_entitie){
    channel.send("No problem!")
    stored = {}
}

export async function createReminder(entitie){
    console.log( entitie )
    // 0. sort
    var _agenda = entitie.agenda_entry ? entitie.agenda_entry : "something" ;
    var style = { Name : _agenda , Group: 'Reminder' , icon: "⏰"};
    if('duration' in entitie){
        //it's recurring task
        style.Unit = Object.keys(entitie.duration)[0] ;
        style.Recurring = Object.values(entitie.duration)[0] ;
    }
    if('datetime' in entitie ){
        //it's one time event
        var CAL = getCalendar(entitie.datetime);
        style.Date = {start : CAL.year +"-" + CAL.month +"-"+CAL.day , end: null }
    }

    // 1. check up message
    var _newEmbed = new MessageEmbed();
    _newEmbed.setTitle("New Reminder");
    Object.keys(style).forEach( k=>{
        _newEmbed.addFields({name : k , value :style[k].toString(),inline:true})
    })
    channel.send({embeds : [_newEmbed] })
    channel.send("Want me to create like this?")


    stored.yesAction = async() =>{
        
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

        channel.send("I added a new reminder for you!")
            
    }
}


export var tellMeAboutReminders = async () =>{
    // 1. get
    var reminders = await notion.datas.filter( data => notion.groupFilter(data,"Reminder" ) )
    reminders = reminders.map( item => 
            { return  {  Name : item.properties.Name.title[0].plain_text,
                        Date : item.properties.Date.date.start,
                        Recurring : item.properties.Recurring.number,
                        Unit : item.properties.Unit.select ? item.properties.Unit.select.name   : null ,
                        URL : item.url,
                        id: item.id
                    }
            } )
    stored.datas = reminders; 
    // 2. Create Message 
    
    var _embed = newEmbed({title: "⏰ All Reminders"})
                 
    for( var i = 0 ; i < reminders.length ; i ++ ){
        var _time = reminders[i].Date;
        _embed.addFields({ name : _time , value : `[ ${i}. ${reminders[i].Name} ](${reminders[i].URL} )` } )
    }

    channel.send({embeds : [_embed] })  

    stored.datas = reminders; 
    return reminders;
}


export var deleteSelected = async ( _entities ) =>{

    if( !stored.datas ){
        channel.send("hmmm.... delete from where? 😗❔ ")
    }

    else{
        channel.send("I can delete if you want!")
        stored.yesAction = async () =>{
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
        

        // 3. Post Tweet
        stored.yesAction = () =>{
            tweet( textBody, mediaURLs )
        }

    })
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
        var day =  date.getDay();
        day = day == 0 ? 6: day - 1;  //start of the week is monday
    
        var worklog = await getTodaysWorklog();
        var columns = await notion.getColumns( worklog ) ; 
    
        Promise.resolve( getTasks(day,columns ) ).then( async ([allTodo, leftTodo] )=>{
            var text = "" ; 
            var _newEmbed = new MessageEmbed();
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
            channel.send({embeds : [_newEmbed] })
            var nextColumn = columns[Math.min(day + 1, columns.length)]
            askBusy( 10 ,leftTodo , nextColumn ); 
        })
        
    }catch(error){
        channel.send("😧Something went wrong "+ error.message)
    }


}

var getTasks = async( day , columns ) =>{
    //var columns = await notion.getColumns( page );
    var TodaysColumn = columns[day]; 
    var allTodo = await notion.getChildren( TodaysColumn, {type:'to_do'} );
    allTodo = await allTodo.filter(b => b.to_do )
    console.log( allTodo )
    var leftTodo = await allTodo.filter( b => !b.to_do.checked );
    
    return [allTodo, leftTodo]; 
}



var notionDateToDate = (stringDate) =>{
    var Cal = stringDate.split("-").map(i => parseInt(i) )
    return new Date(Cal[0], Cal[1]-1, Cal[2]); // ⬜ month number seems larger...
}


export var TellMeAboutProject = async (_entitie)=>{

    
    var AllProjects = await notion.datas.filter( data => notion.groupFilter(data,"Project" ) )
    var Now = now(new Date()) //timezone(new Date())
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
        var Now = now(new Date())
        var leftDays =  Math.floor( (notionDateToDate(end) - Now )/(1000 * 60 * 60 * 24) );
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
       channel.send({embeds : [_embeded] }) 
    }
    else{
        channel.send(
`You don't have any specific project assigned!
Do anything you like!❤`)
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
    else{channel.send({embeds : [_newEmbed] })}

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

export async function getRecipe(_keyword){

    var URL = 'https://tasty.co/search?q='+_keyword+'&sort=popular'
    var _selector ='.feed-item__img-wrapper';

    stored.moreAction = async ()=> {

        const browser = await puppeteer.launch();
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
        channel.send({embeds : [_embeded] }) 

        channel.send(recipe.video);
    }

    try{
        stored.moreAction();
    }catch(error){
        channel.send("Something went wrong with.. "+ error.message)
    }

}

export async function TellMeAboutSocialStat(_entitie){
    
    var stats = {}
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    var URL = 'https://www.instagram.com/happping_min/'
    await page.goto(URL, {waitUntil: 'networkidle2'});
    stats.instagram = await page.$$eval('.Y8-fY', els => els.map(el => el.textContent ) ); //posts, followers, following
    stats.instagram = stats.instagram[1];
    
    var URL = 'https://twitter.com/happping_min'
    await page.goto(URL, {waitUntil: 'networkidle2'});
    stats.twitter = await page.$$eval('.css-4rbku5', els => els.map(el => el.textContent ).filter(el => el.includes("Followers") ) );
    stats.twitter = stats.twitter[0]


    var _embeded = new MessageEmbed()
    _embeded.addFields( {name :"❤️Instagram" , value : stats.instagram  })
    _embeded.addFields( {name :"❤️Twitter" , value :  stats.twitter   })


    channel.send({embeds : [_embeded] }) 
    await browser.close; 
}


export async function getTodaysWorklog(){
    return new Promise(async (resolve,error)=>{
        var worklogs = await notion.datas.filter( data => notion.groupFilter(data,"Log" ) )
        var start = notionDateToDate(worklogs[0].properties.Date.date.start);
        var end = notionDateToDate(worklogs[0].properties.Date.date.end);
        var Now = now(new Date());
        
        if( Now.getTime() <= end.getTime() && Now.getTime() >= start.getTime()   ){
            resolve(worklogs[0]);
        }
        else{
            channel.send("There are no worklog for this week."); 
            CreateNewLog(); 
        }
    })
}

export async function botIn(){
    // When a bot initiate, all the reminder except daily event starts.
    var reminders = await notion.datas.filter( data => notion.groupFilter(data,"Reminder" ) )
    reminders = await reminders.filter(data => data.properties.Unit.select == null || !['minute','hour','day'].includes(data.properties.Unit.select.name)    );
    initCrons(reminders);  
    //SearchGoogle('what is javascript');
    ReadThisSlowly('https://dev.to/devteam/introducing-the-forem-shop-new-merch-giveaways-and-more-4kff');   
}



export async function userIn(){
    var messages = ['Hello!','You came back!',"Hey Darling!"];  
    channel.send( messages[Math.floor( Math.random() * messages.length )]);

    var reminders = await notion.datas.filter( data => notion.groupFilter(data,"Reminder" ) )
    reminders = reminders.filter( data => data.properties.Unit.select == null || ['minute','hour','day'].includes(data.properties.Unit.select.name)    )
    initCrons(reminders); 

    //
    var _embeded = new MessageEmbed().setTitle(` ♥ Let's start Today `)

    // 0. weather
    await getWeather( _embeded , 'Vancouver, BC');

    // 1. todo 

    try{
        var worklog = await getTodaysWorklog(); 
        var columns = await notion.getColumns( worklog ) ; //page
        var day = new Date().getDay()
        day = day == 0 ? 6: day - 1; 
        Promise.resolve( getTasks(day, columns ) ).then( async (  [allTodo , leftTodo]  ) =>{
    
            var todos = await notion.blocks_to_text(allTodo);     
            _embeded.addFields({name : "Tasks", value : todos})
            _embeded.addFields({name : "Count", value : `${allTodo.length-leftTodo.length}/${allTodo.length}`})
        
            // 9. send
            channel.send({embeds : [_embeded] }) 
        
            // 9. if task is too many
            var nextColumn = columns[Math.min(day + 1, columns.length)]
            askBusy(10, leftTodo , nextColumn ); 
    
            if( allTodo.length-leftTodo.length < 5 ){
                var TASKS_URL = "https://www.notion.so/happpingmin/30ddc8bbffcc481cb702da35789f3cf5?v=f6894f5cc1d246a0b49179d270748e2e"
                channel.send(`You seems like free, check out [Tasks Page](${TASKS_URL})`)
            }
            })
    

    }catch(error){
        channel.send("Something went wrong "+ error.message)
    }

  




}

export async function userOut(){
    console.log("You are out!")
    var messages = ["Bye! Have a good day!" ,"See ya!"]
    channel.send( messages[Math.floor( Math.random() * messages.length )]);

    allCrons.forEach( item => { item.stop() })
    allCrons = []; 
}

async function askBusy( _maxCount , tasks , moveGoal ){
    if( tasks.length > _maxCount ){
        const messages = [`😲You are too busy today!
Do you want me to move some tasks to tmr?`];
        var leftArr = tasks.slice(_maxCount) ;
        channel.send( messages[Math.floor( messages.length * Math.random() )] )
        stored.yesAction = async() =>{
            leftArr.forEach(async task =>{
                try{
                    await notion.parent( task, moveGoal )
                }catch(error){
                    channel.send("🤷🏽‍♀️ Something went wrong. " ,error.message)
                }
            })
            channel.send('Yay! You have less tasks for today now!')
        }
    }
}

export async function SearchDictionary( mm, entitie , traits ){
    try{
        var myDictionaries = await notion.datas.filter( data => notion.groupFilter(data,"Dictionary" ) )
        var myDictionary = myDictionaries[0]
    
        var Headers = await notion.getChildren( myDictionary );
        Headers = Headers.filter( header => header[header.type].text.length > 0 && header.has_children )
        //Headers = Headers.map( header => {return {[header[header.type].text[0].plain_text.split(" ")]:header}} )
    
        var search_keys = Object.keys(entitie).map( text => text.toLowerCase() );
        var search_keywords = Object.values(entitie).map( text => text.toLowerCase() )
        
        Headers =  Headers.filter( header =>{
            var header_keywords = header[header.type].text[0].plain_text.split(" ").map( text => text.toLowerCase() );
            return Variable.anyisIn(search_keywords , header_keywords ); 
        })
    
        if( Headers.length > 0 ){
            // 0. get random item
            var header = Headers[Math.floor( Headers.length * Math.random() )]
            var children = await notion.getChildren( header );
            // 1. get random children
            var ChildBlock = children[Math.floor( children.length * Math.random() )]
            var textElements = Object.values(ChildBlock[ChildBlock.type])[0]
            
            textElements = textElements.map( text => {
                if(text.href){ return `[${text.plain_text}](${text.href})` }
                else{ return text.plain_text}
            } )
    
            var foundInfo = ""
            textElements.forEach(text => foundInfo += text )
    
            // 2. Send
            var _embed = new MessageEmbed();
            _embed.setTitle(header[header.type].text[0].plain_text);
            _embed.setDescription(  foundInfo  );
            channel.send({embeds : [_embed] })
            channel.send('Maybe check this out?')
    
        }
        else if( "emotion" in entitie || Variable.anyisIn(["positive","negative"], Object.values(traits)) ){

            var randomWord = search_keys[ Math.floor(search_keys.length * Math.random()) ]
            var gif = await Action.getGIF( randomWord );
            channel.send( gif );

        }
        else if( mm.includes('recipe') ){
            Action.getRecipe('healthy')
        }
        else if( Object.keys(entitie).includes('url') ){
            ReadThisSlowly(entitie.url); 
        }
        else{
            SearchGoogle(mm);
        }
    }catch(err){
        channel.send("Something went wrong on SearchDictionary()")
        channel.send(err.message)
    }    
}

export async function SearchGoogle(mm){
    try{
        channel.send( "Give me a sec.. I am searching for you" )
        var URL = "https://www.google.com/search?q=" + mm ;
        const browser = await puppeteer.launch();
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
        channel.send({embeds : [_embed] })
        await browser.close; 
    }catch(err){
        console.log(err)
        channel.send("Something went wrong on SearchGoogle()")
        channel.send(err.message)
    }
}

export async function ReadThisSlowly(URL){
    //channel.send( "Want me to read for you?" )
    console.log('ReadThisSlowly')

    /*
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(URL, {waitUntil: 'networkidle2'});
    /*
    await page.$eval('body',el=>{
        console.log(el.textContent)
    })

    const body = await page.evaluate(()=>{
        return document.getElementsByTagName("body")[0].textContent;
    })
    console.log( body )

    await page.screenshot({ path: 'temp/tmp.png' })//, fullPage: true });
    await browser.close; 
    */

    await fetch(URL)
    .then(async function( data) {
        //console.log(await data.json());
    })
    /*
    .then(post => {
    console.log(post.title);
    });\*/

    stored.yesAction = () =>{
    }
}