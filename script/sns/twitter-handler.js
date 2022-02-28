import 'dotenv/config' 
import { TwitterApi } from 'twitter-api-v2';


export var client = new TwitterApi({
    appKey: process.env.TWITTER_API,
    appSecret: process.env.TWITTER_SECRET,
    accessToken: process.env.TWITTER_TOKEN,
    accessSecret: process.env.TWITTER_TOKENSECRET,
})


const twitterClient = client.readWrite;



export const tweet = async (text) => {
    try {
        await twitterClient.v1.tweet( text)
    } catch(err){
        console.log(err)
    }
}
