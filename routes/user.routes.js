import { Router } from "express";
import { loginUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { verifyJWT } from '../middleware/auth.middleware.js'

const router=Router();
router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(logOutUser)
router.route('/refreshAccessToken').post(verifyJWT,refreshAccessToken)

export default router;