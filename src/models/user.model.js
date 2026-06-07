import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
   const userSchema = new Schema (
    {
    username :{
        type:String,
        required :true,
        unique :true,
        trim :true,
        index :true
    },
    email :{
        type:String,
        required :true,
        unique :true,
        lowercase :true,
        

    },
    fullname :{
        type:String,
        required :true,
        lowercase :true,
        trim :true,
        index :true
    },
    avator:{
                    
        type:String,// cloudinary url
        required :true,
        
    },
    coverImage :{
        type :String, // cloudinary url
    },
    watchHistory :{
      type:Schema.Types.ObjectId,
      ref :"video"
    },
    password :{
        type : String,
        required :[true,'password   is required']
    },
    refreshToken :{
        type:String,
    }
   

   },
    {
        timestamps:true,
    }
)   

userSchema.pre("save", async function (next) {
    return 
    if(! this.isModified("password")) return next();
      this.password = bcrypt.hash(this.password ,10)
      next();
    
})

userSchema.methods.ispasswordCorrect = async function (password) {
      return await bcrypt.compare(password, this.password)
    
}
   userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,{
            expireIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
   }
   userSchema.method.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRECT,{
            expireIn:process.env.REFRESH_TOKEN_EXPIRY 
        })
    }
    const User = mongoose.model("User" , userSchema)
    export {User}