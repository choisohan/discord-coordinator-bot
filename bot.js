require("dotenv").config()

const Discord = require('discord.js');
const client = new Discord.Client({intents:["GUILDS","GUILD_MESSAGES"]});

client.on('ready',()=>{
    console.log('Out Bot is ready to go')
})


client.on("message", msg =>{
    if(msg.content ==="Hey"){
      msg.reply("Helllooo")
    }
  })
  
client.login(process.env.BOT_TOKEN)
