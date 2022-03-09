
//import { botClient} from './script/handlers/discord-handler.js'
import 'dotenv/config' 

import Discord, { Intents, Collection } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9'
import * as Chat from './script/action/Chat.js'
export var channel;


export var bot = new Discord.Client(
  {intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ,Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],});

  bot.once("ready", ()=>{
    console.log("bot is logged in ")
    
    var clientId = bot.user.id;//'945038953478754374'
    var guildId = '944087799185952778'

    var rest = new REST({
        version:"9"
    }).setToken( process.env.BOT_TOKEN );
    
    (async () =>{
        try{
            await rest.put(Routes.applicationGuildCommands(clientId ,guildId ),{body:commands});
            console.log("successfully registed commands.")
        }catch(err){
            console.log(" 🌀",err)
        }
    })()
    
    channel = bot.channels.cache.find(c => c.name === "general")
    Chat.send("")
  
})

bot.login(process.env.BOT_TOKEN);


const newSlash = (_name,_input,_description) => {return new SlashCommandBuilder()
	.setName(_name)
	.setDescription(_description)
	.addStringOption(option =>
		option.setName('input')
			.setDescription('The input to echo back')
			.setRequired(true));}

const eng = newSlash('eng',"word","I can help your english word"); 
const read = newSlash('read',"URL","I can read article for you"); 

const commands = [ eng ,read ]; 
bot.commands = new Collection(); 
commands.forEach(command =>{
  bot.commands.set(command.name, command)
})


//const commands = [ helpEnglish ]; 

bot.on("interactionCreate", async interaction=>{
  Chat.gotInteraction(interaction)
})
/*
  if(interaction.isCommand()){
    var commandName = interaction.commandName;
    switch(commandName){
      case "eng":
        
        break;
      case "read":
        console.log("🏰");
        break;
    }
  }
*/