import { getSkillsFromJobDescription } from "../ml-model.js/skillExtractor.js";
import { extractTextFromFile } from "../ml-model.js/textExtractor.js";
import { performFullAnalysis } from "../ml-model.js/analyzer.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {getChatResponse} from '../ml-model.js/ai.js';
import fs from "fs";
const conversations={};

const analyzeResumes = asyncHandler(async(req, res) => {
    const resumeFile = req.files['resume_file'] ? req.files['resume_file'][0] : null;
    const jobFile = req.files['job_description_file'] ? req.files['job_description_file'][0] : null;

    if (!resumeFile) {
        throw new ApiError(400, "Resume file is required");
    }
    if(!jobFile){
        throw new ApiError(400, "Job description is required");
    }

    try {
        const jobDescriptionText = await extractTextFromFile(jobFile.path);
        const resumeText = await extractTextFromFile(resumeFile.path);

        if (!jobDescriptionText || !resumeText) {
            throw new ApiError(400, "Could not extract text from one or both files.");
        }

        const skillsToCheck = await getSkillsFromJobDescription(jobDescriptionText);
        const analysis = await performFullAnalysis(resumeText, jobDescriptionText, skillsToCheck);

        return res.status(200).json(new ApiResponse(200, analysis, "Resume analyzed successfully"));

    } catch (error) {
        throw new ApiError(500, error.message || "Error in analyzing resume");
    } finally {
        if (resumeFile) {
            fs.unlink(resumeFile.path, (err) => {
                if (err) console.error("Error deleting temp resume file:", err);
            });
        }
        if (jobFile) {
            fs.unlink(jobFile.path, (err) => {
                if (err) console.error("Error deleting temp job file:", err);
            });
        }
    }
});

const uploadResume=asyncHandler(async(req,res)=>{
    const resumeFile=req.file;
    if(!resumeFile){
      throw new ApiError(400,"Resume upload failed")
    }
    
    try {
        const resumeText=await extractTextFromFile(resumeFile.path)
        if(!resumeText){
            throw new ApiError(400,"Resume text extraction failed")
        }

        const convId=`conv_${Date.now()}`;
        conversations[convId]=resumeText

        return res
        .status(200)
        .json(
            new ApiResponse(200,
            {conversationId: convId,
            initialMessage: "Resume processed. You can now ask me questions about it."
            },
            "Resume uploaded"
            )
        )
    } catch (error) {
        res.status(500).json({ error: 'Failed to process resume for chat.' });
    } finally {
        fs.unlinkSync(resumeFile.path);
    }
})

const handleChat=asyncHandler(async(req,res)=>{
    const {conversationId}=req.params
    const {question}=req.body

    if(!conversationId||!question){
        throw new ApiError(400,"Conversation id and question are required to continue")
    }

    const resumeContext = conversations[conversationId];
    if (!resumeContext) {
        return res.status(404).json({ error: "Conversation not found." });
    }

    const botResponse = await getChatResponse(resumeContext, question);
    if(!botResponse){
        throw new ApiError(400,"Bot response not able to fetch")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,botResponse,"Bot response fetched successfully")
    )
})



export { analyzeResumes,uploadResume,handleChat };