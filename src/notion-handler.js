import 'dotenv/config' 
import { Client } from '@notionhq/client'
import { monday,mmdd } from './calendar.js';

var HOMEPAGE_ID = 'e0ac95fdf5584d9080d55d88da834baf'
var notion;
var HOMEPAGE,DATABASES; 
var BLOCKS = [] ; var notionMsg = ""

function notionInit(){
    notion = new Client( {auth :  process.env.NOTION_TOKEN } );
    getDataBases();
}
async function getDataBases(){
    HOMEPAGE = await notion.blocks.children.list({block_id:HOMEPAGE_ID}); 
    DATABASES = HOMEPAGE.results.filter(page =>page.type ==='child_database')
                .map(page =>({
                    id: page.id, title: ( typeof(page.child_database) =='object'  ) ? page.child_database.title : ""
                }));
    
    // for Copying the Latest Worklog
    
    //createNewPage( DATABASES[0].id,"New Page" , [] );

}
function createNewLog(){
    Promise.resolve( getLatestPage(DATABASES[0].id )).then( latest => { 
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
                    createNewPage(DATABASES[0].id, mmdd(monday), latest.icon.emoji,  children.results  );
                },2000)
                
            }
        )
    })

}

async function getLatestTasks(){
    Promise.resolve(getLatestPage( DATABASES[0].id ))
    .then( latest => {
        console.log(latest.id)
        Promise.resolve( getAllBlocks(latest.id))
            .then( () =>{
                setTimeout(()=>{
                    console.log(BLOCKS.length)
                    var todos = getItemWithType('to_do', BLOCKS)
                                .map(item => ({
                                    text : getText(item.to_do) , //item.to_do.text[0],
                                    checked : item.to_do.checked,
                                    id : item.id
                                })); 
                                
                    var uncompleted = todos.filter(item => 
                        item.checked === false
                    )
                    notionMsg =""
                    uncompleted.forEach(un=>{
                        notionMsg += `
                        -` + un.text
                    })

                }, 2000 )
            })
    })  
}

var getText = (item) => {
    return (item.text && item.text.length > 0  && item.text[0].plain_text ) ?  item.text[0].plain_text : ""
}
function getItemWithType( typeName, array){
    var sorted = []
    sorted = array.filter(item =>item.type === typeName)
    return sorted; 
}
async function getLatestPage(database_ID){
    var DB = await notion.databases.query({database_id : database_ID })
    var items = DB.results
    .filter(log =>{
        if (log.properties.Name.title[0]){
            if(log.properties.Name.title[0].plain_text !=""){
                return true
            }
        }
    })
    return items[0]
}

async function getAllBlocks(pageID){
    BLOCKS = []
    Promise.resolve( await notion.blocks.children.list({block_id: pageID})).then( resolve => {
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
    return await notion.blocks.children.list({block_id: id});
}
async function createNewPage(DATABASE_ID, TITLE, EMOJI,CHILDREN){
    const response = await notion.pages.create({
        parent: {
          database_id: DATABASE_ID,
        },
        icon : {
            emoji : EMOJI
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: TITLE,
                },
              },
            ],
          },
        },
        children: (CHILDREN) ? CHILDREN : emptyChildren,
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

export { notionInit , notionMsg , DATABASES , createNewPage, createNewLog }
