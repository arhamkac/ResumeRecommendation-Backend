import multer from "multer";

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/temp')
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})

export const upload=multer({
    storage
})

export const twoFileUploader = upload.fields([
    { name: 'resume_file', maxCount: 1 },
    { name: 'job_description_file', maxCount: 1 }
]);