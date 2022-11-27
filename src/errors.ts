export class CustomError extends Error {
    public type = "";
    public errorMessage = "";
}


export class BookmarkError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkError);
        this.type = "bookmark_error";
        this.errorMessage = args[0];
    }
}

export class BookmarkAlreadyExistsError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkAlreadyExistsError);
        this.type = "bookmark_already_exists";
        this.errorMessage = args[0];
    }
}

export class HashingError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, HashingError);
        this.type = "hashing-error";
        this.errorMessage = args[0];
    }
}

export class UserAlreadyExistsError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, UserAlreadyExistsError);
        this.type = "hashing-error";
        this.errorMessage = args[0];
    }
}

export class UserError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, UserError);
        this.type = "user-error";
        this.errorMessage = args[0];
    }
}

export class LabelError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, LabelError);
        this.type = "label-error";
        this.errorMessage = args[0];
    }
}