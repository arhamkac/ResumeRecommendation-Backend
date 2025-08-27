import textract from "textract"
import util from 'util'

const extract=util.promisify(textract.fromFileWithPath)
const extractTextFromFile=async(localFilePath)=>{
    try {
        const text=await extract(localFilePath,{preserveLineBreaks:true})
        return text.toLowerCase();
    } catch (error) {
        console.error(`Error throwing file with path ${localFilePath}`)
        return "";
    }
}

export {extractTextFromFile}