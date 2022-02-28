import 'dotenv/config' 
import { Client } from '@notionhq/client'
import { monday,mmdd } from '../extra/scheduler.js';
import { discord , channel } from './discord-handler.js'


var NOTION; var BLOCKS = [] ;
class notionClient{
    constructor(){
        NOTION =  new Client( {auth :  process.env.NOTION_TOKEN } );
        var getDatas = async () => {
            this.home =  await NOTION.blocks.children.list({ block_id:process.env.NOTION_HOME_ID });
           this.databases = {}; 
           this.home.results.forEach(item =>{
               if( typeof(item.child_database) =='object'  ){
                    this.databases[item.child_database.title] = item.id
               }
           })
           //
           //

        }
        getDatas()
    }


    async getPages( database_ID) {

        var DB = await NOTION.databases.query({database_id : database_ID })
        var items = DB.results
        .filter(log =>{
            if (log.properties.Name.title[0]){
                if(log.properties.Name.title[0].plain_text !=""){
                    return true
                }
            }
        })
        return items;
    }

    async getColumns( page_ID ){
        //console.log( "getColumns(" + page_ID +")")
        var Weeks = []; 

        var column_list = await getChildren( page_ID );
        column_list = column_list.results.filter( item =>  item.type=='column_list' );
        
        for(var x = 0; x < column_list.length ; x++ ){
            var column = await getChildren(column_list[x].id)
            column = column.results.filter( item =>  item.type=='column'  );
            
            for ( var y = 0; y < column.length ; y++ ){
                Weeks.push(column[y])
                if(x+1 == column_list.length && y+1  == column.length ){
                    return Weeks;
                }
            }
        }
    }

    async createNewPage( database_ID ){
        duplicateLatest(database_ID); 
    }

    async getChildren( block_id , style ){
        var arr = [];
        await getChildren( block_id ).then( children => {
            children.results.forEach( child1 =>{
                if( itemCheck( child1 , style )){
                    arr.push ( child1 )  ; 
                }
            })
        })
        if( style ){
            if('type' in style){
                arr = arr.filter(i =>
                    style.type in i
                )
            }
        }


        return arr;
    }

    block_to_text( _block ){
        var text = ""
        if( _block.type == "to_do" && "to_do" in _block ){
            text += (!_block.to_do.checked) ? "[ ] " : "[x] " ; 
        }
        var Type = _block[_block.type] ; 
        if( Type && Type.text  && Type.text.length > 0 ){
            var t = Type.text[0].plain_text
            text += t; 
        }
        console.log(text)
        return text;
    }
    
    async blocks_to_text( _blocks ){
        var text = ""
        _blocks.forEach( b =>{
            text += this.block_to_text(b) + "" + lineChange;
       })
       return text;
    }

    async createNew( DATABASE_ID , style ){
        var info = await newPageInfo( DATABASE_ID , style );
        await NOTION.pages.create( info ); 
    }

    async deleteItem( block_ID ){
        await NOTION.blocks.delete({block_id: block_ID});
    }

}


var newPageInfo = async ( DATABASE_ID, style )=>{
    console.log( DATABASE_ID )
    var DB = await NOTION.databases.query({database_id : DATABASE_ID })
    var info = await DB.results[0];
    info.parent = {database_id : DATABASE_ID    }

    var _remove = ['object' ,'id', 'created_time' , 'last_edited_time' , 'created_by','last_edited_by', 'cover' ,'url']
    _remove.forEach( key =>{
        delete info[key]
    })

    var _Properties = info.properties;
    if('Property' in _Properties ){
        delete _Properties.Property
    }
    
    Object.keys( _Properties).forEach( async key =>{
        var type = await _Properties[key].type;
        var type_value = _Properties[key][type];
        delete _Properties[key].id;

        //Empty all
        if( Array.isArray(type_value)  ) {
            var obj = _Properties[key][type][0];
            if(obj){
                obj[obj.type].content = style[key]
                if("plain_text" in obj){ obj["plain_text"] = style[key] }
                _Properties[key][type] = [obj] ;
            }

        }
        else if( typeof(type_value)=="boolean" ){
            _Properties[key][type] = false; 
        }
        else{
            _Properties[key][type] = null; 
        }

    }) 

    info.properties= _Properties;
      
    return info
}






/////////////////////////
async function getAllItems( ID, style ){
    var arr = [];
    
    await Promise.resolve(getChildren(ID))
        .then( resolve =>{
            console.love(resolve)
        })

        

}
/*
async function getLatestTasks( database_ID ){
    var arr = []
    //var today_day = new Date().getDay(); 
    await Promise.resolve( getPages(  database_ID  ))
        .then( pages => {
            var latest = pages[0];
            Promise.resolve( getColumnItems(latest.id)).then( Weeks =>{
                var id  = Weeks[today_day].id;
                Promise.resolve( getAllChildren( id, {type:"to_do"}) ). then (P=>{
                    P.forEach( p => {
                        arr.push(p)
                    })
                    return arr
                })
            });
        })
}
*/ 
//style is dictionary
async function getAllChildren( ID , style ){
    var arr = [];
    await getChildren(ID).then( children => {
        children.results.forEach(child1=>{
            if( itemCheck( child1 , style )){
                //console.log( child1 , style)
                arr.push ( child1 )  ; 
            }

        })
    })
    return(arr)
}

var itemCheck = ( item, style )=>{
    var check = false;
    if ( Object.keys(style).length > 0 ){
        Object.keys(style).forEach( key =>{
            if( key in item){
                if (item[key] = style[key]){
                    check = true;
                }
            }
        })
    }
    else{
        check = true; 
    }
    return check 
}


function duplicateLatest( database_ID ){
    Promise.resolve( getPages(  database_ID )).then( pages => { 
        var latest =  pages[0];
        Promise.resolve ( getChildren(latest.id) ).then(
            children =>{
                var arr = children.results;
                arr.forEach(child1 =>{
                    if(child1.type === 'column_list') {
                        Promise.resolve(getChildren(child1.id)).then(children1 => {
                            child1.column_list.children = children1.results
                            children1.results.forEach(child2 =>{
                                if(child2.type === 'column') { 
                                    Promise.resolve(getChildren(child2.id)).then(children2 => {
                                        
                                        child2.column.children = children2.results.filter(
                                            block =>{
                                                if(block.type === 'paragraph'){
                                                    return true;
                                                }
                                                else{
                                                    if(block.type ==='to_do'){
                                                        if(!block.to_do.checked){
                                                            return true
                                                        }
                                                    }
                                                }
                                            }
                                        )
                                    })
                                    
                                }
                            })
                        }
                        )
                    }
                })
                
                setTimeout(()=>{
                    const style = { title : mmdd(monday) , emoji : latest.icon.emoji ,  children: children.results};
                    if( "Date" in latest.properties ){
                        var date = {start : latest.properties.Date.date.start}
                        if( "end" in latest.properties.Date.date){
                            date.end = latest.properties.Date.date.end
                        }
                        style.date =  date;
                    }
                    createNewPage( database_ID ,  style );
                },3000)
                
            } 
        )
    })

}

async function getLatestTasks(database_ID){
    Promise.resolve( getPages(database_ID ) )
        .then( pages => {
            var latest = pages[0]
            
            Promise.resolve( getAllBlocks(latest.id))
                .then( () =>{
                    setTimeout(()=>{
                        var todos = getItemWithType('to_do', BLOCKS)
                                    .map(item => ({
                                        text : getText(item.to_do) , //item.to_do.text[0],
                                        checked : item.to_do.checked,
                                        id : item.id
                                    })); 
                                    
                        var uncompleted = todos.filter(item => 
                            item.checked === false
                        )

                        var text = "🌈 Today's Tasks " + lineChange
                        uncompleted.forEach(check=>{
                            text += '[ ] '+ check.text + lineChange;                      
                        })
                        //send message
                        channel.send(text)

                    }, 2000 )
                }) 
    }) 
    
}
var lineChange = `
`

var getText = (item) => {
    return (item.text && item.text.length > 0  && item.text[0].plain_text ) ?  item.text[0].plain_text : ""
}
function getItemWithType( typeName, array){
    var sorted = []
    sorted = array.filter(item =>item.type === typeName)
    return sorted; 
}

async function getPages(  database_ID ){
    var DB = await NOTION.databases.query({database_id : database_ID })
    var items = DB.results
    .filter(log =>{
        if (log.properties.Name.title[0]){
            if(log.properties.Name.title[0].plain_text !=""){
                return true
            }
        }
    })
    return items
}

async function getAllBlocks(pageID){
    BLOCKS = []
    Promise.resolve( await NOTION.blocks.children.list({block_id: pageID})).then( resolve => {
        BLOCKS = resolve.results;
        //console.log("level1",BLOCKS.length);
        
        BLOCKS.forEach(b =>{
            if(b.has_children){
                Promise.resolve( getChildren(b.id) ).then( resolve2 =>{
                    resolve2.results.forEach(b2 =>{
                        BLOCKS.push(b2);
                        //console.log("level2",BLOCKS.length);

                        if(b2.has_children){
                            Promise.resolve( getChildren(b2.id) ).then( resolve3 =>{
                                resolve3.results.forEach(b3 =>{
                                    BLOCKS.push(b3);
                                    //console.log("level3",BLOCKS.length);

                                    if(b3.has_children){
                                        Promise.resolve( getChildren(b3.id) ).then( resolve4 =>{
                                            resolve4.results.forEach(b4 =>{
                                                BLOCKS.push(b4);
                                                return BLOCKS;
                                                //console.log("level4",BLOCKS.length);
                                            })
                                        })
                                    }
                                })
                            })
                        }
                    })
                })
            }
        })
    })
}



async function getChildren(id){
    return await NOTION.blocks.children.list({block_id: id});
}

//style is dictionary
async function createNewPage( DATABASE_ID, style ){
    const response = await NOTION.pages.create({
        parent: {
          database_id: DATABASE_ID,
        },
        icon : {
            emoji : ("emoji" in style) ? style.emoji : "✍️"
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: ("title" in style) ? style.title : "NEW",
                },
              },
            ],
          },
          Date :{
            date : {
                start : ("date" in style) ? style.date.start : null,
                end : ("date" in style && "end" in style.date ) ? style.date.end : null 
            }
          }
        },
        children: ("children" in style || style.chldren == [] ) ? style.children : emptyChildren,
      });
}
var emptyChildren  = 
    [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            text: [
              {
                type: 'text',
                text: {
                  content: ' ',
                },
              },
            ],
          },
        },
      ]
      
export var notion = new notionClient(); 
