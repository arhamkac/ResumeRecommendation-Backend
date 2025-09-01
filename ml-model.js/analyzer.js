import { pipeline } from '@xenova/transformers';

{/* I divided the text into chunks to make it better */}
function getTextChunks(text, chunkSize = 250, overlap = 50) {
    if (typeof text !== 'string' || !text) {
        return [];
    }
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
}

{/* Here I have taken out the  word embeddings for text from extractor model and then calculated the average to get a good score*/}
async function getDocumentEmbedding(text, extractor) {
    const chunks = getTextChunks(text);
    if(chunks.length === 0){
        return new Float32Array(extractor.model.config.hidden_size).fill(0);
    }
    const chunkEmbeddings = await Promise.all(
        chunks.map(chunk => extractor(chunk, { pooling: 'mean', normalize: true }))
    );
    const finalEmbedding = new Float32Array(chunkEmbeddings[0].data.length).fill(0);
    for (const embedding of chunkEmbeddings) {
        for (let i = 0; i < finalEmbedding.length; i++) {
            finalEmbedding[i] += embedding.data[i];
        }
    }
    for (let i = 0; i < finalEmbedding.length; i++) {
        finalEmbedding[i] /= chunkEmbeddings.length;
    }
    return finalEmbedding;
}

{/* This is the most crucial part. Here I calculated cosine similarity to match the matching vectors easily rather than normal keyword matching */}
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0, normA = 0.0, normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return (normA === 0 || normB === 0) ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}


async function performFullAnalysis(resumeText, jobDescriptionText, requiredSkills) {
    try {
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

        
        const resumeEmbedding = await getDocumentEmbedding(resumeText, extractor);
        const jobEmbedding = await getDocumentEmbedding(jobDescriptionText, extractor);
        const similarityScore = cosineSimilarity(resumeEmbedding, jobEmbedding);
        const overallMatchScore = parseFloat((similarityScore * 100).toFixed(2));

       
        const matchedSkills = requiredSkills.filter(skill => resumeText.toLowerCase().includes(skill.toLowerCase()));
        const missingSkills = requiredSkills.filter(skill => !resumeText.toLowerCase().includes(skill.toLowerCase()));

        return {
            overall_match_score: overallMatchScore,
            matched_skills: matchedSkills,
            missing_skills: missingSkills,
            analysis_type: "Hybrid: Semantic Score + Keyword Analysis"
        };
    } catch (error) {
        console.error("Error during full analysis:", error);
        return { error: "Failed to perform hybrid analysis." };
    }
}

export { performFullAnalysis };