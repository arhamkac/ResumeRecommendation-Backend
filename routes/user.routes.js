import { Router } from "express";
import { loginUser, logOutUser, refreshAccessToken, registerUser ,sendOTP,verifyOTP,googleLoginUser} from "../controllers/user.controller.js";
import { verifyJWT } from '../middleware/auth.middleware.js'

const router=Router();
router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT,logOutUser)
router.route('/refreshAccessToken').post(verifyJWT,refreshAccessToken)
router.route("/send-otp").post(sendOTP)
router.route("/verify-otp").post(verifyOTP)
router.route("/google").post(googleLoginUser);

export default router;