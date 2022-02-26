import 'dotenv/config' 
import  Wit  from 'node-wit'
import fs from 'fs'
import { PassThrough } from 'stream';
const  talkDB = JSON.parse(fs.readFileSync('./script/conversation/chat-dictionary.json'));


export const witClient = new Wit.Wit({
  accessToken: process.env.WIT_TOKEN,
  logger: new Wit.log.Logger(Wit.log.DEBUG)
});


var allisIn = (must_array , array ) =>{   return must_array.every(x => array.includes(x))}
var anyisIn = (arr1, arr2)=>{
    var bool = false;
    var i = 0; 
    do {
        bool = arr2.includes( arr1[i] )  ;
        i ++; 
    }
    while ( !bool  && i< arr1.length);
    return bool; 
}

export const findIntention = async ( _entities, _intents, _traits  ) =>{
    var entities = Object.values(_entities).map( e =>e[0].name)
    var intents = _intents
                    .filter(e => e.confidence > .75)
                    .map( e=>e.name)
    var traits = {};
    Object.keys(_traits).forEach( k => {
        traits[k]= _traits[k].map(a =>a.value);
    })

    console.log(entities )
    console.log(intents )
    console.log(traits )

    var findDB = null ; var i = 0; 
    do {
        var db = talkDB[i];

        var entitieIn = false ; var intentIn  = false ; var traitKeyIn  = false ; var traitValIn  = false ;
        
        // 1. 
        if( 'entities' in db && db.entities.length > 0 ) {
            entitieIn = anyisIn(entities , db.entities)
        }
        else{entitieIn= true}

        // 2.  intent is must 
        if( 'intents' in db && db.intents.length > 0 ) {
            intentIn = allisIn(intents , db.intents)
        }

        // 3. 
        if('traits' in db && Object.keys(db.traits).length > 0   )
        {
            traitKeyIn = anyisIn( Object.keys(traits) , Object.keys(db.traits)  ) ;
            if(traitKeyIn){       
                Object.keys(traits).forEach( key =>{
                    var test = anyisIn(traits[key] , db.traits[key]) ;
                    traitValIn = test == false ? false : test ; 
                    }
                )
            }
        }
        
        else{
            traitKeyIn = true ;
            traitValIn = true
        }
        

        // fin 
        var result = [entitieIn, intentIn, traitKeyIn, traitValIn ].includes(false);
        //console.log("🍍", entitieIn, intentIn, traitKeyIn, traitValIn ,"🍍")
        //result = result ? false : true;
        if ( !result ){
            findDB = db;
        }
        i ++ 
    }
    while(  !findDB && i < talkDB.length );

    return await findDB; 
}

function test(){
    //add between 🍎🍎🍎
    findIntention(
        {} , [ { id: '1257024694791034', name: 'chat', confidence: 0.7695 } ] , {
            'wit$greetings': [
              {
                id: '5900cc2d-41b7-45b2-b21f-b950d3ae3c5c',
                value: 'true',
                confidence: 0.5625
              }
            ]
          }
    )

}




//test()
