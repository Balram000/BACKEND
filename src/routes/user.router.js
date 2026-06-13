import { Router } from "express";
import {
    registerUser,
    loginuser,
    logoutUser,
    refeshAccestoken,
    changecurrentPassword,
    getCurrentUser,
    updateuseravatat,
    updateuserCoverImage,
    getuserChannelprofile,

} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewar.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post
    (
        upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount: 1
            }
        ]),
        registerUser
    )

router.route("/login").post(loginuser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refesh_token").post(refeshAccestoken)

router.route("/change-Password").post(verifyJWT, changecurrentPassword)
router.route("/Current-User").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateaccountDetails)
router.route("/avatat").patch(verifyJWT, upload.single("avatar"), updateuseravatat)
router.route("/CoverImage").patch(verifyJWT, upload.single("CoverImage"), updateuserCoverImage)
router.route("/c/:username").get(verifyJWT, getuserChannelprofile)
router.route("History").get(verifyJWT, getwatchHistory)


export default router