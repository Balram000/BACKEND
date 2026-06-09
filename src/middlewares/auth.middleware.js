import { MongoAPIError } from "mongodb";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
export const verifyJWT = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies?.accestoken || req.header("authorization")?.replace("Bearer ", "")
     console.log("token",token)
        if (!token) {
            throw new ApiError(401, "unauthorized requied")
        }

        const decodeedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodeedToken?._id).select(" -password -refeshtoken")
        if (!user) {
            throw new ApiError(410, "invlid Access token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(410, error?.message || "invalid access token ")

    }

}
)