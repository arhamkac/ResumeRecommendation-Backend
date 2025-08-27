import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI=new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
async function getSkillsFromJobDescription(jobDescriptionText){
    const model=genAI.getGenerativeModel({model:"gemini-1.5-flash"})
    const prompt=`From the following job description, extract a list of all key technical skills, tools, and qualifications. Return ONLY a clean JSON array of lowercase strings. Job Description: "${jobDescriptionText}"`
    try {
        const result=await model.generateContent(prompt);
        const response=result.response;
        const jsonString=response.text().replace(/```json/g,'').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error extracting skills with AI:", error);
        return [];
    }
}

export {getSkillsFromJobDescription}