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

var lineChange = `
`
export function arrayToString( arr ){
    var string = ''
    for(var i = 0;  i < arr.length; i++ ){
        if( i != 0 ){string += lineChange;}
        string += arr[i];
    }  
    return string 
}

export function arrayToString2( arr ){
    var string = ''
    for(var i = 0;  i < arr.length; i++ ){
        if( i != 0 ){string += lineChange;}
        string += i+". "+ arr[i];
    }  
    return string 
}

//https://stackoverflow.com/questions/8635502/how-do-i-clear-all-intervals
/*
var intervals = {
    Sets : new Set(),
    add(...args){
        var newInterval = setInterval(...args);
        this.Sets.add(newInterval);
        return newInterval;
    },
    delete( id ){
        this.Sets.delete(id);
        return clearInterval(id);
    },
    deleteAll(){
        for (var id of this.Sets) {
            this.clear(id);
        }
    }

} 
*/ 
/*

intervals.add(()=>{console.log("test1")},100000)
intervals.add(()=>{console.log("test2")},200000)
var item = intervals.add(()=>{console.log("test3")},300000)

console.log( Array.from(intervals.Sets).length )

intervals.delete( Array.from(intervals.Sets)[0] )

console.log( Array.from(intervals.Sets).length )

intervals.delete( item )

console.log( Array.from(intervals.Sets).length )
*/ 

/*
var intervals = {Sets: new Set()}


console.log( intervals.Sets )
*/

/*
var intervals = [];
intervals.push ( setInterval(()=>{console.log('test')}, 1000) ) ;
console.log( intervals.length)

setTimeout(()=>{
    console.log("timeout!")
    clearInterval(intervals[0]); 
},5000)
*/ 