import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";

const app=express();
app.use(cookieParser())
app.use(express.urlencoded({extended:true, limit:'100kb'}))
app.use(express.static("public"))
app.use(express.json({limit:"100kb"}))
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

import userRouter from './routes/user.routes.js'
import resumeRouter from './routes/resume.routes.js'

app.use('/users',userRouter)
app.use('/resume',resumeRouter)

export {app}
