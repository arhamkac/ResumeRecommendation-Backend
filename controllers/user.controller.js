import {asyncHandler} from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const generateAccessAndRefreshToken=asyncHandler(async(userId)=>{
    try {
        const user=await User.findById(userId)
        if(!user){
            throw new ApiError(400,"Can't generate access and refresh token without user login")
        }
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.accessToken=accessToken;
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(400,`Error in generating access and refresh tokens ${error}`)
    }
})

const registerUser=asyncHandler(async(req,res)=>{
    const {username,email,password}=req.body
    if([username,email,password].some((field)=>field.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    const userNameExists=await User.findOne({username:username})
    if(userNameExists){
        throw new ApiError(400,"User with username alredy exists")
    }
    
    const userExists=await User.findOne({email:email})
    if(userExists){
        throw new ApiError(400,"User with email alredy exists")
    }

    const user=await User.create({
        email:email,
        username:username,
        password:password
    })
    if(!user){
        throw new ApiError(400,"Error in creating user")
    }

    const createdUser=await User.findById(user._id).select("-password -refreshToken")
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,createdUser,"User resgistered successfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    const {username,password}=req.body
    if([username,password].some((field)=>field.trim()==="")){
        throw new ApiError(400,"Username and password are required to login")
    }

    const user=await User.findOne({username:username})
    if(!user){
        throw new ApiError(400,"Error in finding user")
    }

    const passwordCorrect=await User.isPasswordCorrect(password)
    if(!passwordCorrect){
        throw new ApiError(400,"The password entered is incorrect")
    }
    const loggedInuser=await User.findById(user._id).select("-password -refreshToken")
    const options={
    httpOnly:true,
    secure:true
    }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {user:loggedInuser,accessToken,refreshToken},
      "User logged in successfully"
    )
  )
})

const logOutUser=asyncHandler(async(req,res)=>{
  const user=await User.findById(req.user?._id)
  if(!user){
    throw new ApiError(400,"User is not logged in")
  }

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset:{
        refreshToken:1
      }
    },
    {
      new:true
    }
  )

  const options={
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(
    new ApiResponse(200,{},"User logged out successfully")
  )

})

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(400,"Unauthorized request")
  }

  try {
    const decodedToken=jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    
    const user=await User.findById(decodedToken._id)
    if(!user){
      throw new ApiError(400,"Unauthorized request")
    }

    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(400,"Refresh token not matched with user refresh token")
    }
    const options={
      httpOnly:true,
      secure:true
    }

    const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(200,
        {accessToken,refreshToken:newRefreshToken},
        "Refreshed Access Token successfully"
      )
    )
  } catch (error) {
    throw new ApiError(500,"Error in refreshing access token",error)
  }

})

export {registerUser,logOutUser,loginUser,refreshAccessToken,generateAccessAndRefreshToken}