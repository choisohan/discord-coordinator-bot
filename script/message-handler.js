
export function Talk( _message , _conditions ){
    var result = false;
    var message = _message.toLowerCase();
    
    _conditions.forEach( _word => {
        var word = _word.toLowerCase(); 
        if( message.includes(word) ){result = true}
    });
    
    return result; 
}

