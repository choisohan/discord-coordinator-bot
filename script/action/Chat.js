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
  //console.log( interaction.options._hoistedOptions[0].value )
  if( interaction.isCommand() ){
    var commandName = interaction.commandName;
    var commandOptions = interaction.options._hoistedOptions
    switch(commandName){
      case "eng":
        await interaction.deferReply({ ephemeral: true });
        var embed = await Action.helpEnglish(commandOptions[0].value);
        await interaction.editReply({embeds : [embed] }) 
        break;
      case "read":
        await interaction.deferReply({ ephemeral: true });
        var content = await Action.ReadSlowly(commandOptions[0].value); 
        await interaction.editReply(content) 

        break;
    }
  }
  else if (interaction.isButton()){
    var buttonID = interaction.customId;
    //console.log( interaction )

    switch(buttonID){
      case "Next":
        /*
        const message = await webhook.editMessage('123456789012345678', {
          content: 'Edited!',
          username: 'some-username',
          avatarURL: 'https://i.imgur.com/AfFp7pu.png',
          embeds: [embed],
        });*/ 
        await interaction.deferReply({ ephemeral: true });

        
        //channel.fetchMessage( interaction.webhook.id).edit("!!!")
        channel.messages.fetch(interaction.message.id)
        .then(message => {
          console.log("💖💖💖",message.components[0].components )
          message.components[0].components.forEach( el=> {
            el.setDisabled(true); 
          }) 

          //message.edit({content: message.content, components: message.components }); 
          message.update({ embeds: message.content, components: message.components })

        })
        .catch(console.error);


        var content = await Action.stored.yesAction({})
        await interaction.editReply(content);

        
        break; 
    }
  }

}

//await interaction.reply('Pong!');
//await interaction.followUp('Pong again!');