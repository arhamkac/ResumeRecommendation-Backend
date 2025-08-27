import { Router } from "express";
import { analyzeResumes, handleChat, uploadResume } from "../controllers/resume.controller.js";
import { twoFileUploader } from "../middleware/multer.muddleware.js";
import { upload } from "../middleware/multer.muddleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router=Router();
router.route('/analyze').post(verifyJWT,twoFileUploader,analyzeResumes)
router.route('/upload-resume').post(verifyJWT,upload.single('resume_file'),uploadResume)
router.route('/chat/:conversationId').post(verifyJWT,handleChat)


export default router;