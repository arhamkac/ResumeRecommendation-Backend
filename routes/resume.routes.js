import { Router } from "express";
import { analyzeResumes, handleChat, uploadResume } from "../controllers/resume.controller.js";
import { twoFileUploader } from "../middleware/multer.muddleware.js";
import { upload } from "../middleware/multer.muddleware.js";

const router=Router();
router.route('/analyze').post(twoFileUploader,analyzeResumes)
router.route('/upload-resume').post(upload.single('resume_file'),uploadResume)
router.route('/chat/:conversationId').post(handleChat)


export default router;