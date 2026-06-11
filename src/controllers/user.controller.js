import { asyncHandler } from '../utils/asynchandler.js'
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.model.js"
import { uploardCloundinary } from '../utils/cloundlary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { error } from 'console';
import { subcription } from '../models/subcription.models.js';

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
const refeshAccestoken = asyncHandler(async (req, res) => {
    const incomingRefeshing = req.cookies.refeshtoken || req.body.refeshtoken
    if (!incomingRefeshing) {
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodetoken = jwt.verify(
            incomingRefeshing,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodetoken?._id)
        if (!user) {
            throw new ApiError(401, "invalid refesh token")
        }
        if (incomingRefeshing !== user?.refeshtoken) {
            throw new ApiError(401, "refesh token is expired or used")

        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accestoken, newrefeshtoken } = await generateAccessandrefeshtoken(user._id)
        return res
            .status(200)
            .cookie("accestoken", accestoken, options)
            .cookie("refeshtoken", newrefeshtoken, options)
            .json(
                new ApiResponse(200,
                    accestoken, newrefeshtoken, "accestoken refeshed sccesfully"
                )

            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refesh token")
    }

})

const changecurrentPassword = asyncHandler
    (async (req, res) => {
        const { oldpassword, newpassword } = req.body

        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)

        if (!isPasswordCorrect) {
            throw new ApiError(400, "invalid lod password")
        }
        user.password = newpassword
        await user.save({ validateBeforeSave: false })
        return res
            .status(200)
            .json(new ApiResponse(200, "newpassword sucessfullly"))

    })

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "current user fetched successfully")
})

const updateaccountDetails = asyncHandler(async (req, res) => {
    const { FullName, email } = req.body
    if (!FullName || !email) {
        throw new ApiError(400, " all field are required ")

    }

    const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set: { FullName: FullName, email: email }
        },
        { new: true }
    ).select(" -password ")


    return res
        .status(200)
        .json(new ApiResponse(200, user, "account details updates successfully"))
})



const updateuseravatat = asyncHandler(async (req, res) => {
    const avatarlocalpath = res.file?.path
    if (!avatarlocalpath) {
        throw new ApiError(400, "avatar file is missing")

    }

    const avatar = await uploardCloundinary(avatarlocalpath)
    if (!avatar.url) {
        throw new ApiError(400, "avatar file is missing on uploading time ")

    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        }, {
        new: true
    }
    ).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "avatar update successfully")
        )




})


const updateuserCoverImage = asyncHandler(async (req, res) => {
    const coverimagelocalpath = res.file?.path
    if (!caverimagelocalpath) {
        throw new ApiError(400, "caverimage file is missing")

    }

    const coverImage = await uploardCloundinary(caverimagelocalpath)
    if (!coverImage.url) {
        throw new ApiError(400, "coverimage file is missing on uploading time ")

    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImager: coverImage.url
            }
        }, {
        new: true
    }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "coverImage update successfully")
        )




})

const getuserChannelprofile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")

    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }

        }, {
            $lookup: {
                from: "subcription",
                localField: "_id",
                foreignField: "channel",
                as: "subcription"
            }
        },
        {
            $lookup: {
                from: "subcription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subcription2"
            }
        },
        {
            $addFields: {
                subcriberscount: {
                    $size: "$subcribers"
                }, channelSubscriberedtocount: {
                    $size: "$subscribedto"
                },
                isSubscribedtocount :{
                    $cond :{
                        if :{$in :[req.user?._id,"subcribers.subscriber"]},
                        then :true,
                        else :false
                    }
                }

            }
        },{
            $project :{
                FullName :1,
                username :1,
               subcriberscount : 1,
               channelSubscriberedtocount :1,
               isSubscribedtocount :1,
               avatar :1,
               coverImage :1,
               email :1
               
            }
        }



    ])
})




export {
    registerUser,
    loginuser,
    logoutUser,
    refeshAccestoken,
    changecurrentPassword,
    getCurrentUser,
    updateaccountDetails,
    updateuseravatat,
    updateuserCoverImage,
    getuserChannelprofile
}





