import {asyncHandler} from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import {otpSender,generateOTP} from '../middleware/otp.middleware.js'   
import { OAuth2Client } from 'google-auth-library'
const otp=generateOTP();                
const client=new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_SECRET);                                                                      

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId)
        if(!user){
            throw new ApiError(400,"Can't generate access and refresh token without user login")
        }
        const [accessToken, refreshToken] = await Promise.all([
            user.generateAccessToken(),
            user.generateRefreshToken()
        ]);
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(400,"Error in generating access and refresh tokens ",error)
    }
}

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
    if([username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"Username and password are required to login")
    }

    const user=await User.findOne({username:username})
    if(!user){
        throw new ApiError(400,"Error in finding user")
    }

    const passwordCorrect=await user.isPasswordCorrect(password)
    if(!passwordCorrect){
        throw new ApiError(400,"The password entered is incorrect")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

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

const sendOTP=asyncHandler(async(req,res)=>{
  const {emailId}=req.body;
  if(!emailId){
    throw new ApiError(400,"Unauthorized user")
  }
  
  await otpSender(otp,emailId);
  const user=await User.findOne({email:emailId})
  if(!user){
    throw new ApiError(404,"No such user exists")
  }
  const currOTP=otp
  user.otp=currOTP
  user.otpExpiry=Date.now()+5*60*1000
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(
    new ApiResponse(200,{},"Sent OTP")
  )
})

const verifyOTP=asyncHandler(async(req,res)=>{
  const {emailId,receivedOTP}=req.body
  if(!emailId||!receivedOTP){
    throw new ApiError(404,"Can't proceed without otp and email entering")
  }

  const user=await User.findOne({email:emailId})

  if(receivedOTP!=user.otp){
    throw new ApiError(400,"OTP passed is invalid")
  }
  if(receivedOTP==user.otp && Date.now()>user.otpExpiry){
    throw new ApiError(400,"OTP has expired")
  }

  await user.updateOne(
    {
      $set:{OTPVerified:1}
    }
  )

  return res
  .status(200)
  .json(
    new ApiResponse(200,{},"OTP verified successfully")
  )
})

const googleLoginUser=asyncHandler(async(req,res)=>{
  console.log("Google routes hit")
  const {idToken}=req.body
  console.log(req.body)
  console.log(idToken)
  if(!idToken){
    throw new ApiError(400,"Google token id is required")
  }

  const ticket=await client.verifyIdToken({
    idToken,
    audience:process.env.GOOGLE_CLIENT_ID
  })
  const payload=ticket.getPayload();
  const {email,name,picture,sub}=payload;

  let user=await User.findOne({email:email})
  if(!user){
    user=await User.create({
      email:email,
      googleId:sub,
      username:name,
      provider:"google",
      picture,
      otpVerified:true
    })
  }

   const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

   const options = {
    httpOnly: true,
    sameSite:"lax",
    secure: process.env.NODE_ENV === "production"
    };

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(200,{ user: { id: user._id, email: user.email, username: user.username, picture: user.picture }, accessToken, refreshToken },
      "Google login successful")
    )

})

export {registerUser,logOutUser,loginUser,refreshAccessToken,generateAccessAndRefreshToken,sendOTP,verifyOTP,googleLoginUser}