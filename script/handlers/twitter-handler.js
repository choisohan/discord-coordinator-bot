import 'dotenv/config' 
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import * as fs from 'fs'

export var client = new TwitterApi({
    appKey: process.env.TWITTER_API,
    appSecret: process.env.TWITTER_SECRET,
    accessToken: process.env.TWITTER_TOKEN,
    accessSecret: process.env.TWITTER_TOKENSECRET,
})


const twitterClient = client.readWrite;

//
/*
const mediaIds = await Promise.all([
    twitterClient.v1.uploadMedia('tempFolder/tmp_glttt92xzhz51.png'),
  ]);
  
await twitterClient.v1.tweet('auto tweet test ', { media_ids: mediaIds });
*/ 
//

function writeToFile( _URL ){
    return new Promise(async (resolve, reject)=>{
        var response = await axios({method: 'get',url: _URL , responseType: 'stream'});
        var stream = fs.createWriteStream('tempFolder/tmp_' + _URL.split('/').at(-1)) ;
        response.data.pipe(stream);
        stream.on("finish",()=>{
            resolve(stream)
        })
    })
}

export const tweet = async (text , urls ) => {
    try {

        if(urls){
            const Files = await Promise.all(  urls.map(async url => await writeToFile(url)  )  )
            const mediaIds = await Promise.all( Files.map( file => twitterClient.v1.uploadMedia(file.path)  ))
            await twitterClient.v1.tweet( text , { media_ids: mediaIds } )
        }
        else{
            await twitterClient.v1.tweet( text )
        }
        
    } catch(err){
        console.log(err)
    }
    
}