export var allisIn = (must , target ) =>{
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

export var anyisIn = (arr1, arr2)=>{
    var bool = false;
    var i = 0; 
    do {
        bool = arr2.includes( arr1[i] )  ;
        i ++; 
    }
    while ( !bool  && i< arr1.length);
    return bool; 
}

//to sub array
export function chunk (arr, len) {

    var chunks = [],
        i = 0,
        n = arr.length;
  
    while (i < n) {
      chunks.push(arr.slice(i, i += len));
    }
  
    return chunks;
  }