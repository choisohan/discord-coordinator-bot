import Discord from "discord.js";
import 'dotenv/config' 
import { reminderInit } from "./action/notion-task-manager.js";

export var discord = new Discord.Client({intents:["GUILDS","GUILD_MESSAGES"]});
export var channel;


discord.on('ready',()=>{
    console.log("bot is logged in ")
    channel = discord.channels.cache.find(c => c.name === "general")
    reminderInit(); 
})

discord.login(process.env.BOT_TOKEN);
