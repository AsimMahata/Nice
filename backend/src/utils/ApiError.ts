class ApiError <T=any> extends Error{
    statusCode: number;
    success: boolean;
    errors: T[];

    constructor(statusCode: number, message: string, errors: T[] = [], stack?: string){
        super(message);

        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.success = false;

        if(stack){
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;