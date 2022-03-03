import { discord , channel} from './script/handlers/discord-handler.js'
import * as Chat from './script/action/Chat.js'


// Slash Command
/*
discord.on("interactionCreate", async interaction=>{
  if(interaction.isCommand()){
  }
})
*/ 



discord.on("messageCreate", async msg=>{

  if(!msg.author.bot){

    if(!msg.attachments.size){
      var mm = msg.content.toLowerCase();
      if ( mm == "clear"){Action.clearChannel();}
      else {await Chat.send( msg.content );}
    }

    else{
      //if there's attachment
    }

  }
})


