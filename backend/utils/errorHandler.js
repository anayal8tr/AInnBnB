// utils/errorHandler.js
class noResourceError extends Error {
    constructor(message,status){
        super(message)
        this.message = message,
        this.status = status || 500
    }
    throwThis(){
        throw this;
    }
    static throw(message,status){
        const newError = noResourceError(message,status)
        throw newError;
    }
}


class ErrorHandler extends Error {
    constructor(message, status, errors = null) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

module.exports = { noResourceError, ErrorHandler };