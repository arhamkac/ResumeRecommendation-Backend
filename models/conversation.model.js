import mongoose,{Schema} from "mongoose";

const conversationSchema=new Schema(
    {
        resumeFile:{
            type:String,
            required:true
        },
        jobDescriptionFile:{
            type:String,
            required:true
        },
        analysisResult: {
            overall_match_score: { type: Number },
            matched_skills: [{ type: String }],
            missing_skills: [{ type: String }], 
            analysis_type: { type: String }
        },
        chatHistory: [
            {
                role: {
                    type: String,
                    enum: ['user', 'bot'],
                    required: true
                },
                content: {
                    type: String,
                    required: true
                },
                timestamp: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
    },
    {timestamps:true}
)

export const Conversation=mongoose.model("Conversation",conversationSchema)