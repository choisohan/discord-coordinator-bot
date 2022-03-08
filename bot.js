import { discord} from './script/handlers/discord-handler.js'
import * as Chat from './script/action/Chat.js'


// Slash Command
/*
discord.on("interactionCreate", async interaction=>{
  if(interaction.isCommand()){
  }
})
*/ 

discord.on("messageCreate", async msg =>{
  if(!msg.author.bot){
    if(!msg.attachments.size){Chat.send( msg.content.toLowerCase() );}
  }
})

discord.on("messageReactionAdd", async reaction =>{Chat.emojiReaction(reaction)})


