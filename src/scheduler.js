var curr = new Date;

export var monday = new Date(curr.setDate(curr.getDate() - curr.getDay()));

export var sunday = new Date(curr.setDate(curr.getDate() - curr.getDay()+6));

export var mmdd = (d)=>{return zeroPad(d.getMonth()+1, 2) + zeroPad(d.getDate()+1 ,2) }

function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}

