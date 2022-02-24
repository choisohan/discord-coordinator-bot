import 'dotenv/config' 
import  Wit  from 'node-wit'

export const witClient = new Wit.Wit({
  accessToken: process.env.WIT_TOKEN,
  logger: new Wit.log.Logger(Wit.log.DEBUG)
});


export const witCompare = ( _source, _target ) => {

    // 1. sorting
    var source = {entities : [], intents :[] ,traits :[] }
    Object.values(_source.entities).forEach( e =>{
        source.entities.push(e[0].name)
    })

    _source.intents.forEach(i => {
        source.intents.push(i.name)
    });

    Object.values(_source.traits).forEach( t=>{
        source.traits.push(t[0].value)
    })



    // 2. compare
    var bool = false; 
    ['entities','intents','traits'].forEach( key =>{
        if(Object.keys(_target).includes(key)){
            _target[key].forEach(t =>{
                //console.log(  t  ," in ", source[key] )
                if( source[key].includes(t) ){
                    bool = true; 
                }
            })
        }

    })

   return bool; 

}