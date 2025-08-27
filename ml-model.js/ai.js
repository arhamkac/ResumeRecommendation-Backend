import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../utils/ApiError.js";

const genAI=new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
const model=genAI.getGenerativeModel({model:"gemini-1.5-flash"})

async function getChatResponse(resumeContext,userQuestion){
    const prompt = `You are an expert HR analyst. Based ONLY on the following resume text, answer the user's question.
    Resume Text: """${resumeContext}"""
    User Question: "${userQuestion}"`;
    try {
        const result=await model.generateContent(prompt);
        const response=await result.response;
        return response.text();
    } catch (error) {
        console.log("Error in getting response from AI ",error)
        return "I'm sorry, I encountered an error and can't answer that right now.";
    }
}

export {getChatResponse}