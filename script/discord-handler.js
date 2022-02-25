import Discord from "discord.js";
import 'dotenv/config' // ES6
//import { monday,mmdd } from './scheduler.js';
//import * as cron from 'cron'
import { CronJob } from "cron";

export var discord = new Discord.Client({intents:["GUILDS","GUILD_MESSAGES"]});
export var channel;


discord.on('ready',()=>{
    console.log("bot is logged in ")
    channel = discord.channels.cache.find(c => c.name === "general")

    // Daily Schedule

    setSchedule('0 9 * * *',()=>{channel.send("☀️😉Good Morning, Sweetie!")} ); 
    setSchedule('0 12 * * *',()=>{channel.send("It's almost Lunch Time!🥪")} ); 
    setSchedule('0 18 * * *',()=>{channel.send("🍝 Dinner Time, Min!")} ); 
    setSchedule('30 22 * * *',()=>{channel.send("🌃 You are not working til this late, huh? Please wrap it up and call it a day, Min")} ); 

    // Weekly Schedule
    setSchedule('5 9 * * MON',()=>{channel.send("The new start of the Week!")} ); 
    setSchedule('5 9 * * FRI',()=>{channel.send("Almost the end of the week, min!")} ); 
    setSchedule('5 18 * * FRI',()=>{channel.send("Yay Friday!😍🍷")} ); 
})


discord.login(process.env.BOT_TOKEN);

function setSchedule(cronTime, eventFunction ){new CronJob(cronTime, eventFunction, null, null , process.env.TIMEZONE).start();}