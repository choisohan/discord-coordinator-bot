<<<<<<< HEAD
//import { botClient} from './script/handlers/discord-handler.js'
import 'dotenv/config' 

import Discord, { Intents, Collection } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9'

import * as Chat from './script/action/Chat.js'

export var botClient = new Discord.Client(
  {intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ,Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],});

export var channel;
botClient.once("ready", ()=>{
    console.log("bot is logged in ")
    
    var clientId = botClient.user.id;//'945038953478754374'
    var guildId = '944087799185952778'

    var rest = new REST({
        version:"9"
    }).setToken( process.env.BOT_TOKEN );
    
    async () =>{
        try{
            await rest.put(Routes.applicationGuildCommands(clientId ,guildId ),{body:commands});
        }catch(err){
            console.log("🌀🌀🌀🌀🌀🌀")
        }
    }
    
    channel = botClient.channels.cache.find(c => c.name === "general")
    //Chat.send("Hello!")
    
})

botClient.login(process.env.BOT_TOKEN);

=======
import { discord} from './script/handlers/discord-handler.js'
import Rollbar from 'rollbar';
import * as Chat from './script/action/Chat.js'

var rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR,
  captureUncaught: true,
  captureUnhandledRejections: true
});
rollbar.log("Hello world!");
>>>>>>> 6b10efe9fd0c770877842487628ff897f552077f

// Slash Command
/*
botClient.on("interactionCreate", async interaction=>{
  if(interaction.isCommand()){
  }
})
*/

botClient.on("messageCreate", async msg =>{
  if(!msg.author.bot){
    if(!msg.attachments.size){Chat.send( msg.content.toLowerCase() );}
  }
})

botClient.on("messageReactionAdd", async reaction =>{Chat.emojiReaction(reaction)})

