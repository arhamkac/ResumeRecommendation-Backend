import { connectDB } from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv"

dotenv.config({
    path:'./.env'
})

connectDB()
.then(
    app.listen(process.env.PORT||3000,()=>{
       console.log(`Server is running on ${process.env.PORT}`)
    })
)
.catch((err)=>{
    console.log("Error in running db ",err)
})