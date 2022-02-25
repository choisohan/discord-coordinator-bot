import 'dotenv/config' 
import  Wit  from 'node-wit'
import fs from 'fs'
import { PassThrough } from 'stream';
const  talkDB = JSON.parse(fs.readFileSync('./script/conversation/chat-dictionary.json'));

//import fs from 'fs'
//const  talkDict = JSON.parse( fs.readFileSync('chat-dictionary.json') ) ;


export const witClient = new Wit.Wit({
  accessToken: process.env.WIT_TOKEN,
  logger: new Wit.log.Logger(Wit.log.DEBUG)
});

//witCompare( style, {intents : ["greeting"]} )

var allisIn = (must_array , array ) =>{   return must_array.every(x => array.includes(x))}
var anyisIn = (arr1, arr2)=>{
    var bool = false;
    for (var i = 0; i < arr1.length ; i++ ){
        if( arr2.includes( arr1[i] ) ){ bool = true; }
    }
    return bool; 
}

//console.log(  "❤️❤️❤️ ",anyisIn([1,2],[1,2,3,4,5])  );
/*
var allisThis = (value, array ) =>{
    return array.includes(value)
}
console.log( "❤️❤️❤️" ,allisThis(true, [true,true]))
*/ 

export const findIntention = ( _entities, _intents, _traits  ) =>{
    console.log( "-------------------")

    console.log( "🌿 👩‍🌾 🏛️ ❤️ 🍕 🍎 ")
    var entities = Object.values(_entities).map( e =>e[0].name)
    var intents = _intents.map( e=> e.name)
    var traits = {};
    Object.keys(_traits).forEach( k => {
        traits[k]= _traits[k].map(a =>a.value);
    })
    
    console.log(entities)
    console.log(intents)
    console.log(traits)
    console.log( "-------------------")
    

    for ( var i = 0; i < talkDB.length; i++ ){
        var db = talkDB[i];

        var condition = () =>{
            var entitieIn = true ; var intentIn  = true ; var traitKeyIn  = true ; var traitValIn  = true ;

            if(db.entities.length > 0 ) {entitieIn = allisIn(entities , db.entities)}
            if(db.intents.length > 0 ) {intentIn = allisIn(intents , db.intents)}

            //if(db.traits.length > 0 ){

                traitKeyIn = allisIn( Object.keys(traits) , Object.keys(db.traits)  ) ;
                traitValIn = false; 
                if(traitKeyIn){       
                    Object.keys(traits).forEach( key =>{
                        var test = allisIn(traits[key] , db.traits[key]) ;
                        traitValIn = test == false ? false : test ; 
                        }
                    )
                }


            //}



            var result = [entitieIn, intentIn ,traitKeyIn , traitValIn].includes(false)
            result = result ? false : true;

            console.log( "[",entitieIn, intentIn ,traitKeyIn , traitValIn ,"]  👉 ",result  );

            return result; 
        }

        if( condition() ){
            //console.log( db)
        }


    }

    



/*
    //console.log( entities,intents, traits )
    // Now let's compare with json!

    //let's compare intents
    var compare = []; 
    talkDB.forEach( db =>{
        //compare.push( db.entities.every( x => x.includes(entities))); 
        //compare.push( db.intents.every( y => y.includes(intents) )); 
        //compare.push( db.traits.every( x => y.includes(intents) )); 


    })
    */ 

    //console.log( compare )


}
//{mood : ['bored','d'] }


/*    {} , [ { id: '1257024694791034', name: 'chat', confidence: 0.996 } ] , 
{mood: [ { id: '1310233119486660', value: 'bored', confidence: 0.9882 } ]}
*/ 

export const witCompare = ( _source, _target ) => {

    // 1. sorting
    var source = {entities : [], intents :[] ,traits :[] }
    Object.values(_source.entities).forEach( e =>{source.entities.push(e[0].name)})
    _source.intents.forEach(i => {source.intents.push(i.name)});
    Object.values(_source.traits).forEach( t=>{source.traits.push(t[0].value)})



    // 2. compare
    var bool = []; 
    ['entities','intents','traits'].forEach( key =>{
        if(Object.keys(_target).includes(key)){
            var arr1 = source[key] ;
            var arr2 = _target[key];
            bool.push ( arr2.every( item =>{
                //console.log( item ,arr1 , arr2 )
                return arr1.includes(item)
            } ) ) ;
        }
    })

    bool = bool.includes(false) ? false : true; 
    //console.log(source , _target ,  bool)
    return bool; 
}



