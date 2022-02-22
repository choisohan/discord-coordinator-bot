var curr = new Date;
var monday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
var sunday = new Date(curr.setDate(curr.getDate() - curr.getDay()+6));
var mmdd = (d)=>{return zeroPad(d.getMonth()+1, 2) + zeroPad(d.getDate()+1 ,2) }
function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}
export {monday,sunday , mmdd}
