import { DB_NAME } from "../constants.js"
import mongoose from "mongoose"
const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect((`${process.env.MONGODB_URI}/${DB_NAME}`))
        console.log("MongoDB Connection started: ",connectionInstance.connection.host)
    } 
    catch(error){
        console.log("Error in connecting to MongoDB ",error)
    }
}

export {connectDB}