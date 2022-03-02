import 'dotenv/config' 
import { TwitterApi } from 'twitter-api-v2';


export var client = new TwitterApi({
    appKey: process.env.TWITTER_API,
    appSecret: process.env.TWITTER_SECRET,
    accessToken: process.env.TWITTER_TOKEN,
    accessSecret: process.env.TWITTER_TOKENSECRET,
})


const twitterClient = client.readWrite;


export const tweet = async (text , mediaURLs ) => {
    try {
        //maybe use xiaos 
        const mediaIds = await Promise.all(
            //mediaURLs.map( url => twitterClient.v1.uploadMedia(url) )
            mediaURLs.map( url => twitterClient.v1.uploadMedia( Buffer.from(rotatedImage), { type: 'png' })  )
            )
        await twitterClient.v1.tweet( text , { media_ids: mediaIds } )
        
        //await twitterClient.v1.tweet( text )

    } catch(err){
        console.log(err)
    }
}
//tweet('test', ['https://media.nationalgeographic.org/assets/photos/000/263/26383.jpg'])
//tweet('test tweet',[])