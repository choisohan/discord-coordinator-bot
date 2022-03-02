import 'dotenv/config' 
import { Client } from '@notionhq/client'
import { monday,mmdd } from '../extra/scheduler.js';
import { discord , channel } from './discord-handler.js'
import { CronJob } from 'cron';
import { ApplicationCommandPermissionType } from 'discord-api-types/v9';
import { allisIn ,chunk } from '../extra/compare.js';
import { CommandInteractionOptionResolver } from 'discord.js';

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
        }
        getDatas()
    }


    async getPages( database_ID ) {

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

    async getColumns( page ){
        //console.log( "getColumns(" + page_ID +")")
        var Weeks = []; 

        var column_list = await this.getChildren( page );
        column_list = column_list.filter( item =>  item.type=='column_list' );
        
        for(var x = 0; x < column_list.length ; x++ ){
            var column = await this.getChildren(column_list[x])
            column = column.filter( item =>  item.type=='column'  );
            
            for ( var y = 0; y < column.length ; y++ ){
                Weeks.push(column[y])
                if(x+1 == column_list.length && y+1  == column.length ){
                    return Weeks;
                }
            }
        }
    }

    async createNewPage( database_ID, BUILD ){ 
        var pages = await this.getPages(database_ID)
        var latest = pages[0];
       
        //BUILD = BUILD!= null ? BUILD : function(x){return x }; 
        latest = await this.allChildren(latest, BUILD  )
        
        //emoji: icon" in latest ? latest.icon.emoji :
        const style = { title : mmdd(monday) , children: latest.children };
        if( "Date" in latest.properties ){
            var date = {start : latest.properties.Date.date.start}
            if( "end" in latest.properties.Date.date){
                date.end = latest.properties.Date.date.end
            }
            style.date =  date;
        }

        var newPage = await createNewPage(database_ID, style); 
        return newPage;
    }
    
    async modifyPage( _page , _properties ){
        _properties = Object.entries(_properties).filter = ( [ key , value ] ) => _page.includes( key ) ;
        _properties = Object.fromEntries(properies)
        console.log( "🌸",_properties )

        //_properties = { name of properties : value , value }
         
        /*
        const response = await NOTION.pages.update({
            page_id: _page.id,
            properties :{ }
        })
        */ 
    }

    async getChildren( _block ){
        if(_block.has_children || _block.object == "page"){
            var children =  await NOTION.blocks.children.list({ block_id: _block.id });
            return children.results
        }else{
            return [] }
    }
    


    async allChildren( _block , _function ){

    
        var container = { body:[], header: [] , footer :[] };  //body, header, bottom
        if( _block.has_children || _block.object == "page" ){
            var arr =  await NOTION.blocks.children.list({ block_id: _block.id });
            container.body = arr.results;

            if(_function ){container = await _function(container)}
            arr = container.body; 
          
            for( var x = 0; x < arr.length ; x++ ){
                if(arr[x].has_children){
                    console.log( "❤ "+arr[x].type )
                    var arr1 = await NOTION.blocks.children.list({ block_id: arr[x].id });

                    
                    container.body = arr1.results;
                    if(_function){container = await _function(container)}
                    arr1 = container.body;
                
                    arr[x][arr[x].type].children  = container.body;
                    for( var y = 0; y < arr1.length ; y++ ){
                        
                        if(arr1[y].has_children){
                            //console.log( "🧡 "+arr1[y].type )
                            var arr2 = await NOTION.blocks.children.list({ block_id: arr1[y].id });

                            container.body = arr2.results;
                            if(_function){container = await _function(container)}
                            arr2 = container.body;

                            arr1[y][arr1[y].type].children  = container.body;

                            for( var z = 0; z < arr2.length ; z++ ){
                                if(arr2[z].has_children){
                                    //console.log("💛 " +arr2[z].type )
                                    var arr3 = await NOTION.blocks.children.list({ block_id: arr2[z].id });

                                    container.body = arr3.results;
                                    if(_function){container = await _function(container)}
                                    arr3 = container.body;


                                    arr2[z][arr2[z].type].children  = container.body;

                                    for( var w = 0; w < arr3.length ; w++ ){
                                        if(arr3[w].has_children){
                                            console.log("💙 "+arr3[w].type )
                                            var arr4 = await NOTION.blocks.children.list({ block_id: arr3[w].id });
                                            
                                            container.body = arr4.results;
                                            if(_function){container = await _function(container)}
                                            arr4 = container.body;

                                            arr3[w][arr3[z].type].children  = container.body;
                                        }
                                    } 

                                }
                            } 
                        }
                    } 
                } 
            }
            //header and footer

            arr = container.header.concat(arr)

            // Assign
            if( !_block.type ) { _block.type = "children" }
            _block[_block.type] = arr;
            console.log( "💥" )
            return _block; 
        }
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
        return await NOTION.pages.create( info  ); 
    }

    async deleteItem( block_ID ){
        await NOTION.blocks.delete({block_id: block_ID});
    }

    async spreadItem( page , _maxcount ){
        // get all chldren
        var children = await this.getChildren( page ); 
        children = children.filter( child=> !["column","column_list"].includes(child.type) )
        //console.log( children.length)
        var Chunks = chunk( children, _maxcount);

        // get columns
        var columns = await this.getColumns( page ); 
        
        // create new 
        for(var x = 0; x < Chunks.length; x ++){
            x = Chunks.length > columns.length ? columns.length : Chunks.length ; 
            for(var y = 0; y < Chunks[x].length; y ++ ){
                await NOTION.blocks.children.append({
                    block_id : columns[x].id, children :[ duplicatedBlock( Chunks[x][y] ) ]
                })
                await NOTION.blocks.delete({block_id : Chunks[x][y].id })
            }
        }
    }
    async itemFilter ( arr, _filters){
        return await arr.filter(item => {
            var result = true; 
            Object.keys(_filters).forEach(key =>{
                if( key in item[item.type] ){
                    if( item[item.type][key] == _filters[key] ){
                        result = false;
                    }
                }
            })
            return result; 
        })
    }

}

////////////////////////////////////
var duplicatedBlock = (block) => {
    var Text = block[block.type].text;
    console.log( "🍈 ",Text )
    var object =  {object: 'block' }
    object.type = block.type
    object[block.type] = {
        text: Text,checked: false
    }
    return object
}
var PropertyHQ = ( _type, _value ) =>{
    if ( _type == 'text'){
        return { type :_type, [_type]: { content : _value } } 
    }
    if( _type == 'title' ) {
        return { type :_type, [_type]: [  { type :"text", text: { content : _value } }   ]} 
    }
    if( _type == "date"){
        return { type :_type, [_type]: { start : _value , end : null }} ;
    }
    if( _type == 'select' ){
        return { type :_type, [_type]: { name : _value }} 
    }
    if ( _type =='number'){
        return { type :_type, [_type]: _value }
    }
}
var newPageInfo =  async (DATABASE_ID, _style) =>{
    var DB = await NOTION.databases.query({database_id : DATABASE_ID })
    var _scanned = DB.results[0].properties; 
    _style.Name = 'Name' in _style ? _style.Name : "New"; 
    var _properties = {} 

    Object.keys(_style).forEach(_st => {
        _properties[_st] = PropertyHQ(_scanned[_st].type, _style[_st] ); 
        console.log( _scanned[_st] )
        console.log( _properties[_st] )        
    })


    var _info = { parent: {database_id : DATABASE_ID}, properties: _properties}

    return  _info
}
/*
var newPageInfo = async ( DATABASE_ID, style )=>{
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
*/ 





/////////////////////////
/*
async function getAllItems( ID, style ){
    var arr = [];
    
    await Promise.resolve(getChildren(ID))
        .then( resolve =>{
            console.love(resolve)
        })
}*/
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
/*
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
*/ 
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


/*
async function getChildren( id ){
    return await NOTION.blocks.children.list({block_id: id});
}
*/ 

//style is dictionary
async function createNewPage( DATABASE_ID, style ){
    //console.log( "✍️✍️✍️createNewPage✍️✍️✍️ ")
    

    const response = await NOTION.pages.create({
        parent: {
          database_id: DATABASE_ID,
        },
        icon : {
           // emoji : ("emoji" in style) ? style.emoji : "✍️"
            emoji :  "✍️"

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

    return response; 
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



