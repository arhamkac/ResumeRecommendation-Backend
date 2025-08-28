import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema=new Schema(
    {
        username:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required: function() { return this.provider === "local"; }
        },
        refreshToken:{
            type:String
        },
        otp:{
            type:String
        },
        otpExpiry:{
            type:Date
        },
        otpVerified:{
            type:Boolean
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true
        },
        provider: {
            type: String,
            enum: ["local", "google"],
            default: "local"
        },
        picture: {
            type: String
        }
    },{timestamps:true}
)

userSchema.pre('save',async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);
    }
})

userSchema.methods.isPasswordCorrect=async function(password) {
   return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken=async function(next){
    return jwt.sign(
        {
        _id:this.id,
        email:this.email,
        username:this.username
        },
        process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken=async function(next){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,{
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userSchema);