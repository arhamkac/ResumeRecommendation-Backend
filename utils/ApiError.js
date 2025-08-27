class ApiError extends Error{
    constructor(
        message,statusCode,errors=[],stack
    ){
        super(message)
        this.data=null
        this.statusCode=statusCode
        this.success=false
        this.errors=errors

        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}