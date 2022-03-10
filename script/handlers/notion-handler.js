import 'dotenv/config' 
import { Client } from '@notionhq/client'
import {  channel } from '../../bot.js'//'./discord-handler.js'
import { chunk } from '../extra/util.js';
import { botIn } from '../action/Actions.js';
var NOTION; var BLOCKS = [] ; 


class notionClient{
    constructor(){
        NOTION =  new Client( {auth :  process.env.NOTION_TOKEN } );
        Promise.resolve( this.getPages(process.env.NOTION_DB_ID) ).then(
            resolve => {
                this.datas = resolve;
                botIn()
            }
        )

    }

    async appendChild( parent , children ){
        await NOTION.blocks.children.append({
            block_id: parent.id ,
            children : children
        }); 
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
    
    async modifyPage( _page , _properties ){
        _properties = Object.entries(_properties).filter = ( [ key , value ] ) => _page.includes( key ) ;
        _properties = Object.fromEntries(_properties)
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
            if(_function ){  container = await _function(container)  }
            
            arr = container.body; 
           

            for( var x = 0; x < arr.length ; x++ ){
                if( hasChildren(arr[x]) ){
                    var arr1 = await NOTION.blocks.children.list({ block_id: arr[x].id });
                    container.body = arr1.results;
                    if(_function){container = await _function(container)}
                    container.body = if_column( arr[x] , container.body); 
                    arr1 = container.body;
                    
                    arr[x][arr[x].type].children  = arr1

                    for( var y = 0; y < arr1.length ; y++ ){
                        if( hasChildren(arr1[y]) ){
                            var arr2 = await NOTION.blocks.children.list({ block_id: arr1[y].id });
                            container.body = arr2.results;
                            if(_function){container = await _function(container)}
                            container.body = if_column( arr1[y] , container.body); 
                            arr2 = container.body;
                            arr1[y][arr1[y].type].children  = arr2;

                            for( var z = 0; z < arr2.length ; z++ ){
                                if( hasChildren(arr2[z]) ){
                                    var arr3 = await NOTION.blocks.children.list({ block_id: arr2[z].id });
                                    container.body = arr3.results;
                                    if(_function){container = await _function(container)}
                                    container.body = if_column( arr2[z] , container.body); 
                                    arr3 = container.body;
                                    arr2[z][arr2[z].type].children  = arr3;

                                    for( var w = 0; w < arr3.length ; w++ ){
                                        if(  hasChildren(arr3[w]) ){
                                            var arr4 = await NOTION.blocks.children.list({ block_id: arr3[w].id });
                                            container.body = arr4.results;
                                            if(_function){container = await _function(container)}
                                            container.body = if_column( arr3[w] , container.body); 
                                            arr4 = container.body;
                                            arr3[w][arr3[z].type].children  = arr4;
                                        }
                                    } 

                                }
                            } 
                        }
                    } 
                } 
            }
            arr = container.header.concat(arr)
            if( !_block.type ) { _block.type = "children" }
            if(!_block.type){ _block[_block.type].children = arr }
                else{ _block.children = arr;  }
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
        return text;
    }
    
    async blocks_to_text( _blocks ){
        var text = ""
        _blocks.forEach( b =>{
            text += this.block_to_text(b) + "" + lineChange;
       })
       return text;
    }

    groupFilter( data , value){
        return data.properties.Group.select != null && data.properties.Group.select.name == value;
    }

    async createNew( DATABASE_ID , style , BUILD ){
        var pages = this.datas.filter(d => this.groupFilter(d, style.Group) )
        //var pages = await this.getPages(DATABASE_ID)
        var latest = pages[0];
        latest = await this.allChildren( latest , BUILD  )
        style.children = latest.children;               
        var info = await newPageInfo( latest , style );
        return await NOTION.pages.create( info ); 
    }

    async deleteItem( block_ID ){
        await NOTION.blocks.delete({block_id: block_ID});
    }

    
    async spreadItem( page , _maxcount ){
        // get all chldren
        var children = await this.getChildren( page ); 
        children = children.filter( child => !["column","column_list"].includes(child.type) )
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
    

    async parent( block , goalParent ){
        
        await NOTION.blocks.children.append({
            block_id : goalParent.id, children :[ duplicatedBlock( block  ) ]
        })
        await NOTION.blocks.delete({ block_id : block.id })
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

    delete(){

    }

}

////////////////////////////////////
var duplicatedBlock = (block) => {
    var Text = block[block.type].text;
    var object =  {object: 'block' }
    object.type = block.type
    object[block.type] = {text: Text,checked: false}
    return object
}
var PropertyHQ = ( _type, _value ) =>{
    if ( _type == 'text'){
        return { type :_type, [_type]: { content : _value } } 
    }
    if( _type == 'title' ) {
        return { type :_type, [_type]: [  { type :"text", text: { content : _value } }   ]} 
    }
    if( _type == 'select' ){
        return { type :_type, [_type]: { name : _value }} 
    }
    if ( _type =='number'){
        return { type :_type, [_type]: _value }
    }
    if(_type == 'date'){
        return {type : _type , [_type] : _value }
    }
    if(_type =="icon"){
        return {type : "emoji" , [_type] : _value }
    }
}

var newPageInfo =  async(  _refPage , _style) =>{
    _style.Name = 'Name' in _style ? _style.Name : "New"; 
    var _properties = {}
    var styleKeys = Object.keys(_style).filter( _st => _st != "children" &&  _st != "icon" )

    styleKeys.forEach(_st => {
        _properties[_st] = PropertyHQ( _refPage.properties[_st].type , _style[_st] ); 
    })
    var _info = { parent: { database_id : _refPage.parent.database_id },
                properties: _properties,
                children: "children" in _style ? _style.children : emptyChildren}
    /*
    if("icon" in _refPage &&  _info.icon != null ){
        _info.icon = {type:"emoji", emoji: _refPage.icon.emoji } 
    }
    */ 
   if("icon" in _style){
    _info.icon = { type: 'emoji', emoji: _style.icon }
   }
    
    return  _info;
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
        
        BLOCKS.forEach(b =>{
            if(b.has_children){
                Promise.resolve( getChildren(b.id) ).then( resolve2 =>{
                    resolve2.results.forEach(b2 =>{
                        BLOCKS.push(b2);

                        if(b2.has_children){
                            Promise.resolve( getChildren(b2.id) ).then( resolve3 =>{
                                resolve3.results.forEach(b3 =>{
                                    BLOCKS.push(b3);

                                    if(b3.has_children){
                                        Promise.resolve( getChildren(b3.id) ).then( resolve4 =>{
                                            resolve4.results.forEach(b4 =>{
                                                BLOCKS.push(b4);
                                                return BLOCKS;
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
var hasChildren = ( block ) =>{
    return (["column_list" , "column" ].includes( block.type ) || block.has_children)
}
var if_column = ( block , array ) =>{
    if(["column_list" , "column" ].includes( block.type ) && array.length < 1){
        return emptyChildren;     }
    else{ return array; }
}

export var notion = new notionClient(); 



