import { asyncHandler } from '../utils/asynchandler.js'
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.model.js"
import { uploardCloundinary } from '../utils/cloundlary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt  from 'jsonwebtoken';

const generateAccessandrefeshtoken = async (userId) => {
    try {
        const user = await User.findById(userId)
      //  console.log("gen func user:", user)
        const accestoken = user.generateAccessToken()
      //  console.log("accesstoken done")
        const refeshtoken = user.generateRefreshToken()
       // console.log("refeshtoken done")
        user.refeshtoken = refeshtoken
        await user.save({ validateBeforeSave: false })
       // console.log("saved")
        return { accestoken, refeshtoken }
    } catch (error) {
        console.log("GEN ERROR:", error.message)
        throw new ApiError(500, "something went wrong while genrsting refresh and acess token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation
    //check if user already exists
    // check for image and avatar
    //uplaod them to cloudinary,check avatar
    //crate user object crate entry in db
    //remove pass and refesh token field from respone
    // check for user creation 
    //return res

    const { FullName, email, username, password } = req.body
    console.log("email", email);
   // console.log(req.body);

    if ([FullName, email, username, password].some((field) =>
        field?.trim() === "")
    ) { throw new ApiError(400, "all field are required") }

    const existeduser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existeduser) {
        throw new ApiError(409, "username or email is already exist")
    }
   // console.log(req.files);
    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    const coverimagelocalpath = req.files?.coverImage?.[0]?.path;


    //console.log("avatarlocalpath:", avatarlocalpath)

    if (!avatarlocalpath) {
        throw new ApiError(400, "avatar files is required")
    }
    const avatar = await uploardCloundinary(avatarlocalpath)
    const coverImage = await uploardCloundinary(coverimagelocalpath)

    if (!avatar) {
        throw new ApiError(400, "avatar files is required")
    }
    const crateuser = await User.create({
        FullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        email,
        username: username.toLowerCase()

    })

    const createuser = await User.findById(crateuser._id).select(
        "-password  -refreshToken")

    if (!createuser) {
        throw new ApiError(500, " something went is wrong white register the user ")
    }

    return res.status(201).json(
        new ApiResponse(200, createuser, "user registed successfully")
    )

})

const loginuser = asyncHandler(async (req, res, next) => {
    //req.body =>data
    // username or email 
    //find thre user 
    //password check
    //acess and refesh token 
    //send cookie 

    const { email, username, password } = req.body
    //console.log("login hit", email, password)

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")

    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
 //   console.log("user found", user)
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }
    const ispasswordvalid = await user.isPasswordCorrect(password)
   // console.log("user found ", ispasswordvalid)
    if (!ispasswordvalid) {
        throw new ApiError(401, "invalid username or passward")
    }
    const { accestoken, refeshtoken } = await generateAccessandrefeshtoken(user._id)

//console.log("accestoken",accestoken)
//console.log("refreshtoken",refeshtoken)


    const loginuser = await User.findById(user._id).select(
        "-password -refeshtoken"
    )

  //  console.log("loginuser :", loginuser)

    const options = {
        httpOnly: true,
        secure: true
    }
   // console.log("options set",)
    return res
        .status(200)
        .cookie("accestoken", accestoken, options)
        .cookie('refeshtoken', refeshtoken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loginuser, accestoken, refeshtoken
                },
                "user login succesfully "
            )
        )
})

const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refeshtoken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accestoken", options)
        .clearCookie("refeshtoken", options)
        .json(new ApiResponse(200, {}, "user logoutuser sucessfully"))
})
const refeshAccestoken  =asyncHandler(async(req ,res) =>{
    const incomingRefeshing= req.cookies.refeshtoken || req.body.refeshtoken
    if(!incomingRefeshing){
        throw new ApiError(401,"unauthorized request")
    }
try {
    const decodetoken = jwt.verify(
            incomingRefeshing,
            process.env.REFRESH_TOKEN_SECRET
        )
    const user =await User.findById(decodetoken?._id)
       if(!user){
        throw new ApiError(401,"invalid refesh token")
       } 
       if (incomingRefeshing!==user?.refeshtoken) {
        throw new ApiError(401,"refesh token is expired or used")
        
       }
       const options={
        httpOnly :true,
        secure:true
       }
    const {accestoken,newrefeshtoken} =  await generateAccessandrefeshtoken(user._id)
       return res
       .status(200)
       .cookie("accestoken" ,accestoken,options)
       .cookie("refeshtoken",newrefeshtoken,options)
       .json(
        new ApiResponse(200,
            accestoken ,newrefeshtoken ,"accestoken refeshed sccesfully"
        )
    
       )
} catch (error) {
   throw new ApiError(401,error?.message ||"invalid refesh token") 
}

})


export {
    registerUser,
    loginuser,
    logoutUser,
    refeshAccestoken,
}





