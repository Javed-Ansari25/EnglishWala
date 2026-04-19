// Error class
class ApiError extends Error {
    constructor(statusCode, message="something went wrong", errors=[], stack = "") {
        super(message);
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}


//  Response class
class ApiResponse {
    constructor(statuscode, data, message = "success") {
        this.statuscode = statuscode
        this.data = data
        this.message = message
        this.success = statuscode < 400
    }
}

export {ApiError, ApiResponse}
