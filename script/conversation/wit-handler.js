import 'dotenv/config' 
import  Wit  from 'node-wit'
import fs from 'fs'
const  talkDB = JSON.parse(fs.readFileSync('./script/conversation/chat-dictionary.json'));


export const witClient = new Wit.Wit({
  accessToken: process.env.WIT_TOKEN,
  logger: new Wit.log.Logger(Wit.log.DEBUG)
});


var allisIn = (must , target ) =>{
    if(Array.isArray(must) && Array.isArray(target) ){ // array mode
        return must.every(x => target.includes(x))
    }
    else{ // object mode 
        
        var keyIn = Object.keys(must).every( x => Object.keys(target).includes(x) )
        if( keyIn ){  
            Object.keys(must).forEach( key =>{
                keyIn= must[key]== target[key] 
            })
        }
        return keyIn; 
    }
}


//console.log( "🐊🐊🐊" , allisIn( {value: 1}, {value : 1   }))

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
    var findDB = null ; var i = 0; 
    // 0.
    var entities = {}; 
    Object.keys(_entities).forEach( key => {
        entities[_entities[key][0].role]=  _entities[key][0].value
    }
        )
    
    var intents = _intents
                    .filter(e => e.confidence > .75)
                    .map( e=>e.name)
    var traits = {};
    Object.keys(_traits).forEach( k => {
        traits[k]= _traits[k].map(a =>a.value);
    })

    console.log( "🐊🐊🐊" , entities)

    
    do {
        var db = talkDB[i];

        var entitieIn = false ; var intentIn  = false ; var traitKeyIn  = false ; var traitValIn  = false ;
        
        // 1. 
        if( 'entities' in db && Object.keys(db.entities).length > 0 ) {
           entitieIn = allisIn(  db.entities,  Object.keys(entities)  )
        }
        else{
            entitieIn= true
        }

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
        console.log(entitieIn, intentIn, traitKeyIn, traitValIn )
        if ( !result ){
            findDB = db;
        }
        i ++ 
    }
    while(  !findDB && i < talkDB.length );
    
    return await findDB; 
}

function test(){
    //add between 🍎🍎🍎 "no""
    findIntention(

        {
            'greeting:greeting': [
              {
                id: '4695281580570653',
                name: 'greeting',
                role: 'greeting',
                start: 0,
                end: 2,
                body: 'hi',
                confidence: 0.9995,
                entities: [],
                value: 'hi',
                type: 'value'
              }
            ]
          } , [ { id: '484839933191110', name: 'greeting', confidence: 0.9687 } ] , {
            'wit$greetings': [
              {
                id: '5900cc2d-41b7-45b2-b21f-b950d3ae3c5c',
                value: 'true',
                confidence: 0.9999
              }
            ]
          }


    )


}





