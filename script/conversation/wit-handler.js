import 'dotenv/config' 
import  Wit  from 'node-wit'
import fs from 'fs'
import { allisIn, anyisIn } from '../utils/compare.js';
const  talkDB = JSON.parse(fs.readFileSync('./script/conversation/chat-dictionary.json'));


export const witClient = new Wit.Wit({
  accessToken: process.env.WIT_TOKEN,
  logger: new Wit.log.Logger(Wit.log.DEBUG)
});

////////////
export const entitiesFilter = ( _entities ) =>{
    var entities = {}; 
    Object.keys(_entities).forEach( key => {
        if( _entities[key][0].role  == 'duration'){
            var duration = {}; 
            [ "second","minute", "hour","day","week","month", "year"].forEach(unit=>{
                if(unit in _entities[key][0]){
                    duration[unit] = _entities[key][0][unit]
                }
            })
            console.log( duration)
            entities[_entities[key][0].role]=  duration ; //_entities[key][0].normalized.value
        }
        else{
            entities[_entities[key][0].role]=  _entities[key][0].value
        }
        
    }
        )
    return entities;
}
export const intentFilter = ( _intents ) =>{
    return _intents.filter(e => e.confidence > .75).map( e=>e.name);
}
export const traitFilter = ( _traits ) =>{
    var traits = {};
    Object.keys(_traits).forEach( k => {
        traits[k]= _traits[k].map(a =>a.value);
    })
    return traits; 
}
///////////

export const findIntention = async ( _entities, _intents, _traits  ) =>{
    var findDB = null ; var i = 0; 
    // 0.
    var entities = entitiesFilter(_entities); 
    var intents = intentFilter(_intents); 
    var traits = traitFilter(_traits); 

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




