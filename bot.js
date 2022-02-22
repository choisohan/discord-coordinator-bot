import 'dotenv/config' // ES6
import Discord from "discord.js";
import { notionInit , notionMsg , DATABASES , createNewPage, createNewLog } from './src/notion-handler.js';
const client = new Discord.Client({intents:["GUILDS","GUILD_MESSAGES"]});

import { monday,mmdd } from './src/calendar.js';


client.on('ready',()=>{
    console.log('Out Bot is ready to go')
})
notionInit()

client.on("message", msg =>{
    if(msg.content ==="todo"){
      msg.reply( "This is the latest 👉 "+ notionMsg )
    }

    if(msg.content === "create new"){
        createNewLog();
        msg.reply(`I just created new [${mmdd(monday)}] Log for you!❤️`)
    }
  })
  
client.login(process.env.BOT_TOKEN)

