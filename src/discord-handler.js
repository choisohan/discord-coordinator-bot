import Discord from "discord.js";
import 'dotenv/config' // ES6
import { monday,mmdd } from './scheduler.js';
import * as cron from 'cron'


export var discord = new Discord.Client({intents:["GUILDS","GUILD_MESSAGES"]});
export var channel;


discord.on('ready',()=>{
    console.log("bot is logged in ")
    channel = discord.channels.cache.find(c => c.name === "general")

    // Daily Schedule
    new cron.CronJob('0 9 * * *', ()=>{channel.send("☀️😉Good Morning, Sweetie!")}).start();
    new cron.CronJob('0 12 * * *', ()=>{channel.send("It's almost Lunch Time!🥪")}).start();
    new cron.CronJob('0 18 * * *', ()=>{channel.send("🍝 Dinner Time, Min!")}).start();
    new cron.CronJob('30 22 * * *', ()=>{channel.send("🌃 You are not working til this late, huh? Please wrap it up and call it a day, Min")}).start();

    // Weekly Schedule
    new cron.CronJob('5 9 * * MON', ()=>{channel.send("The new start of the Week!")}).start();
    new cron.CronJob('5 9 * * FRI', ()=>{channel.send("Almost the end of the week, min!")}).start();
    new cron.CronJob('5 18 * * FRI', ()=>{channel.send("Yay Friday!😍")}).start();
})


discord.login(process.env.BOT_TOKEN);

