import * as Wit from '../handlers/wit-handler.js'
import * as Action from './Actions.js'
import { bot, channel } from '../../bot.js'//'../handlers/discord-handler.js';
import * as Utils from '../extra/util.js'
import { MessageEmbed, MessageActionRow, Webhook } from 'discord.js'

//https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json
var yes = ['👍','😍','🙏','❤️',"💯","👌","💖","😃","😄","😆","😆","😀","😁","😇","😎","🔥"]
var no = ['😑','😬','👎']

export async function send( mm ){
  /*
  var words =  mm.split(' ');
  var URL =  words.filter(el=> Utils.isValidHttpUrl(el))
  if( URL.length > 0 ){ // 1. if it has valid URL
    console.log("yes")
    Action.ReadSlowly(URL[0]);
  }else if( Utils.anyisIn(["meaning", "mean", "?"],words) )
  */ 


  /*
    if(mm.split(" ")[0] == 'clear'){Action.clearChannel()}



    else if( yes.includes(mm) || no.includes(mm) ){
      emojiReaction(mm)
    }
   // else if(mm.split(" ")[0] == 'translate'){Action.translate()}
   
    else{
    Wit.client.message(mm).then( async ( {entities, intents, traits} ) => { 
      var entities = Wit.entitiesFilter(entities); 
      var intents = Wit.intentFilter(intents); 
      var traits = Wit.traitFilter(traits); 
      
      var findDB =  await Wit.findIntention( entities, intents, traits) ; 
      if('message' in findDB ){
        var rand_message = findDB.message[ Math.floor(findDB.message.length * Math.random()) ] ;
        channel.send(rand_message) ; // send random message from the list
      }
      if('script' in findDB ){eval( await findDB.script[0] )}
      
      }
      
      )
    }
    */ 
    
  }


export async function emojiReaction( _emoji ){
    if(yes.includes(_emoji)){
        Action.respondYes(); 
    }
    else if(no.includes(_emoji)){
        Action.respondNo(); 
    }
}


export async function gotInteraction(interaction){
  if( interaction.isCommand() ){ commandRequested(interaction) }
  else if (interaction.isButton()){ buttonPressed(interaction) }

}


async function commandRequested(interaction){
  await interaction.deferReply();
  console.log(`🙉${interaction.commandName} Command Requested`)
  var commandOptions = interaction.options._hoistedOptions
  switch(interaction.commandName){
    case "eng": //✍
      var embed = await Action.helpEnglish(commandOptions[0].value);
      await interaction.editReply({embeds : [embed] }) 
      break;
    case "read": //📒
      var content = await Action.ReadSlowly(commandOptions[0].value); 
      await interaction.editReply(content) 
      break;
  }
}


async function buttonPressed(interaction){
  
  // 0. remove button I pressed
  await interaction.channel.messages.fetch( interaction.message.id ).then(async message => {
    await message.edit({content : message.content , components : [] }); //delete button!
  }).catch(err => {
      console.error("👉" , err.message);
  });

  // 1. update the latest message
  interaction.deferReply();
  /*
  await interaction.deferReply();// ⬜interaction.followUp
  switch( interaction.customId ){
    case "Next":
      console.log(Action.stored.yesAction() )
      var content = await Action.stored.yesAction()
      await interaction.editReply(content);
      break; 
  }
  */ 
  

  

}


