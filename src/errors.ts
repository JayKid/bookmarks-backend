export class CustomError extends Error {
    public type = "";
    public errorMessage = "";
};


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
};