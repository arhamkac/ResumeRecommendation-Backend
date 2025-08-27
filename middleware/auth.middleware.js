import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'

const verifyJWT=asyncHandler(async(req,res,next)=>{
    try {
        console.log("--- DEBUGGING JWT ---");
        console.log("Cookie value received:", req.cookies?.accessToken);
        console.log("Type of cookie value:", typeof req.cookies?.accessToken);
        console.log("---------------------");
        const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(500,"Authorization error")
        }
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(400,"User not found with given token")
        }
        req.user=user
        next();
    } catch (error) {
        console.log("Error message ",error.message)
        throw new ApiError(400,`Athurization error`)
    }
})

export {verifyJWT}