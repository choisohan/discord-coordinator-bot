// db
import mongoose from 'mongoose';
//import { CronJob } from 'cron'

mongoose.connect(process.env.MONGODB_SRV,{
    useNewUrlParser : true,
    useUnifiedTopology : true
  }).then(()=>{
    console.log('connected to the database')
  }).catch((err)=>{
    console.log(err)
  })
  

class mongoDB {
  constructor(_name, _schema ){
    this.schema = new mongoose.Schema(_schema);
    this.model = new mongoose.model(_name, this.schema);
  }
  
  async add(_properties){
    var NEW = await new this.model(_properties ).save();
    return NEW; 
  }
  edit(filter, update){ //{ name : }, {name : }
    this.model.updateOne(filter ,
    {$set: update } )
  }
  


}

//Create DB
/*
export const reminder = new mongoDB('reminder' ,
  { name : String,
    cronTime: String,
    script : String, 
    message : [String],
    isRecurring : Boolean
  }); 
*/
/*
export const memory = new mongoDB('memory',
  { name : String, 
    script : String
  })*/ 

//reminder.add({name : "test", cronTime : "3 * * * *", message:["test!!🐵 🧞‍♀️🐊 🐋"] })