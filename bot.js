import { discord} from './script/handlers/discord-handler.js'
import Rollbar from 'rollbar';
import * as Chat from './script/action/Chat.js'

var rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR,
  captureUncaught: true,
  captureUnhandledRejections: true
});
rollbar.log("Hello world!");

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


