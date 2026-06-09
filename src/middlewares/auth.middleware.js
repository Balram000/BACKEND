import { MongoAPIError } from "mongodb";
import { asyncHandler } from "../utils/asynchandler.js";
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
export const verifyjwt = asyncHandler(async (req,res,next) =>
    {

    try {
        req.cookies?.accessToken  || req.header("authorization")?.replace("Bearer","")
    
        if(!token){
            throw new ApiError(401,"unauthorized requied")
        }
    
     const decodeedToken = jwt.verifyjwt(token,process.env.ACCESS_TOKEN_SECRET )
    const user = await User.findById(decodeedToken?._id).select(" -password -refreshToken")
    if(!user){
        throw new ApiError(410,"invlid Access token")
    }
    req.user =user;
    next()
    } catch (error) {
        throw new ApiError(410, error?.message || "invalid access token ")
        
    }
 
    }
)