import { discord , channel} from './script/handlers/discord-handler.js'
import * as Chat from './script/action/Chat.js'


// Slash Command

discord.on("interactionCreate", async interaction=>{
  console.log("🌲",interaction )
  if(interaction.isCommand()){
  }
  console.log(interaction)
})




discord.on("messageCreate", async msg =>{
  if(!msg.author.bot){
    if(!msg.attachments.size){
      Chat.send( msg.content ); 
    }
    else{
    }

  }
})


discord.on("messageReactionAdd", async reaction =>{
  console.log(reaction._emoji.name)
})


