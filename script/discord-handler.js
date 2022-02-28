import Discord, { Client, Intents, Collection } from "discord.js";
import 'dotenv/config' 
import { reminderInit } from "./action/notion-task-manager.js";
import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9'

//export var discord = new Discord.Client({intents:["GUILDS","GUILD_MESSAGES"]});
export var discord = new Discord.Client({intents:[
    Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES
]});


const newSlash = new SlashCommandBuilder()
	.setName('tweet')
	.setDescription('Post New Tweet')
	.addStringOption(option =>
		option.setName('input')
			.setDescription('The input to echo back')
			.setRequired(true));


const commands = [ newSlash ]; 

export var channel;
discord.commands = new Collection(); 
commands.forEach(command =>{
    discord.commands.set(command.name, command)
})


discord.once("ready", ()=>{
    console.log("bot is logged in ")

    var clientId = discord.user.id;//'945038953478754374'
    var guildId = '944087799185952778'

    var rest = new REST({
        version:"9"
    }).setToken(process.env.BOT_TOKEN);


    (async () =>{
        try{
            await rest.put(Routes.applicationGuildCommands(clientId ,guildId ),{body:commands});
            console.log("successfully registed commands.")
        }catch(err){
            console.log(" 🌀",err)
        }
    })()
    
    channel = discord.channels.cache.find(c => c.name === "general")
   // channel.send("I am in✨");
    reminderInit(); 

})

/*
discord.on('ready',()=>{
    console.log("bot is logged in ")
    channel = discord.channels.cache.find(c => c.name === "general")
    reminderInit(); 



})
*/ 
discord.login(process.env.BOT_TOKEN);



export const newEmbed = (_embeded) =>{
    return new Discord.MessageEmbed().setTitle(_embeded.title)
                                    .addFields(_embeded.field)


}

