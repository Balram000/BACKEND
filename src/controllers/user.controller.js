import { asyncHandler } from '../utils/asynchandler.js'
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.model.js"
import { uploardCloundinary } from '../utils/cloundlary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessandrefeshtoken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accesstoken = user.generateAccessToken()
        const refeshtoken = user.generateRefreshToken()
        user.refeshtoken = refeshtoken
        user.save({ validateBeforeSave: false })

        return { accesstoken, refeshtoken }
    } catch (errror) {
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
    console.log(req.body);

    if ([FullName, email, username, password].some((field) =>
        field?.trim() === "")
    ) { throw new ApiError(400, "all field are required") }

    const existeduser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existeduser) {
        throw new ApiError(409, "username or email is already exist")
    }
    console.log(req.files);
    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    const coverimagelocalpath = req.files?.coverImage?.[0]?.path;


    console.log("avatarlocalpath:", avatarlocalpath)

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

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }
    const ispasswordvalid = await user.ispasswordCorrect(password)
    if (!ispasswordvalid) {
        throw new ApiError(401, "invalid username or passward")
    }
    const { accesstoken, refeshtoken } = await generateAccessandrefeshtoken(user._id)

    const loggeduser = User.findById(user._id).select(
        "-password -refreshToke"
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accesToken", accessToken, options)
        .cookie('refeshToken', refeshToken, options)
        .json
    new ApiResponse(200),
    {
        user: loggeduser, accesstoken, refeshToken
    },
        "user logged succesfully "
})

const loggout = asyncHandler(async (req, res, next) => {
    User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
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
    .clearCookie("accesToken", options)
    .clearCookie("refeshToken" ,options)
    .json(new ApiResponse (200,{},"user logged out"))
})



export {
    registerUser,
    loginuser,
    loggout
}





