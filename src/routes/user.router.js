 import { Router } from "express";
 import {loggout, registerUser} from "../controllers/user.controller.js";
 import { upload } from "../middlewares/multer.middlewar.js";
 import { loginuser } from "../controllers/user.controller.js";
 import { verifyjwt } from "../middlewares/auth.middleware.js";

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

 router.route("/logout").post(verifyjwt ,loggout)


 export default router