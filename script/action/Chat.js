import * as Wit from '../handlers/wit-handler.js'
import * as Action from './Actions.js'
import {  channel } from '../../bot.js'//'../handlers/discord-handler.js';
import * as Utils from '../extra/util.js'
import fs from 'fs'
export const  talkDB = JSON.parse(fs.readFileSync('./script/extra/chat-dictionary.json'));
const replyDB = talkDB.filter( el => el.onReply == true) 

//https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json
export var yesEmojies = ['👍','😍','🙏','❤️',"💯","👌","💖","😃","😄","😆","😆","😀","😁","😇","😎","🔥"]
export var noEmojies = ['😑','😬','👎']

export async function send( message , reference ){
  var mm = message.toLowerCase();
  var words =  mm.split(' ');
  var DB = !reference ? talkDB : replyDB;
  var refMessage ;
  if( reference ){
    await channel.messages.fetch(reference.messageId).then(
       original  =>{
         refMessage = original.content;
    }
  )}
  // 0. Clear
  if ( mm.substring() == "clear" ){
    Action.clearChannel(); 
  }
  // 1. Read Slowly
  else if( Utils.isValidHttpUrl( words.at(-1)) ){ // 1. if it has valid URL
    channel.send(await Action.ReadSlowly( words.at(-1) ))
  }
  // 2. Emoji Reaction
  else if( yesEmojies.includes(mm) ){
    channel.send(await Action.respondYes()); 
  }
  else if( noEmojies.includes(mm) ){
    channel.send(await Action.respondNo()); 
  }

  // 3. 
  else{
  Wit.client.message(mm).then( async ( {entities, intents, traits} ) => { 
    
    var entities = Wit.entitiesFilter(entities); 
    var intents = Wit.intentFilter(intents); 
    var traits = Wit.traitFilter(traits); 
    console.log("💖", entities , intents , traits)
    var findDB =  await Wit.findIntention( entities, intents, traits, DB ) ; 

    if('script' in findDB ){
      var response = await eval(findDB.script[0] );
      channel.send( response )

    }})}
  }



export async function gotInteraction(interaction){
  if( interaction.isCommand() ){ commandRequested(interaction) }
  else if (interaction.isButton()){ buttonPressed(interaction) }
}

async function commandRequested(interaction){
  await interaction.deferReply();
  var commandOptions = interaction.options._hoistedOptions
  var input = commandOptions[0].value

  switch(interaction.commandName){
    case "eng": //✍
      var response = await Action.helpEnglish(input);
      break;
    case "read": //📒
      var response = await Action.ReadSlowly(input); 
      break;
    case "todo": //✅
      var response = await Action.createNewTask(input); 
      break;
    case "goog": //🔍
      var response = await Action.SearchGoogle(input); 
      break; 
    case "remind": //⏰
      var response = await Action.createReminder(input); 
      break; 

  }
  await interaction.editReply( response ) 
}


async function buttonPressed(interaction){
  
  // 0. remove button I pressed
  await interaction.channel.messages.fetch( interaction.message.id ).then(async message => {
    await message.edit({content : message.content , components : [] }); //delete button!
  }).catch(err => {
      console.error("👉" , err.message);
  });

  // 1. update the latest message
  interaction.reply('...')
  interaction.deleteReply(); 
  
  switch( interaction.customId ){
    case "Next":
      var content = await Action.yesAction['ReadSlowly']()
      channel.send(content); 
      //await interaction.editReply(content);
      break; 
  }
}

export async function gotReaction( reaction ){
  var emoji = reaction._emoji.name;
  console.log( emoji )

  if( yesEmojies.includes(emoji) ){
    channel.send(await Action.respondYes()); 
  }
  else if( noEmojies.includes(emoji) ){
    channel.send(await Action.respondNo()); 
  }
  
}

