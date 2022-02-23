// db
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_SRV,{
    useNewUrlParser : true,
    useUnifiedTopology : true
  }).then(()=>{
    console.log('connected to the database')
  }).catch((err)=>{
    console.log(err)
  })
  