 import { Router } from "express";
 import {logoutUser, registerUser} from "../controllers/user.controller.js";
 import { upload } from "../middlewares/multer.middlewar.js";
 import { loginuser } from "../controllers/user.controller.js";
 import { verifyJWT } from "../middlewares/auth.middleware.js";

 const router = Router()

 router.route("/register").post
 (
    upload.fields([
        {
            name:"avatar",
            maxCount :1
        },
        {
            name :"coverImage",
            maxCount:1
        }
    ]),
registerUser
)
 
 router.route("/login").post(loginuser)

 router.route("/logout").post(verifyJWT ,logoutUser)
 
 router.route("/refesh_token").post(refeshAccestoken)

 export default router