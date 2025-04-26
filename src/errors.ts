export class CustomError extends Error {
    public type = "";
    public errorMessage = "";
}


export class BookmarkError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkError);
        this.type = "bookmark-error";
        this.errorMessage = args[0];
    }
}

export class BookmarkDoesNotExistError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkDoesNotExistError);
        this.type = "bookmark-does-not-exist";
        this.errorMessage = args[0];
    }
}

export class BookmarkAlreadyExistsError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkAlreadyExistsError);
        this.type = "bookmark-already-exists";
        this.errorMessage = args[0];
    }
}

export class BookmarkAlreadyHasLabelError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkAlreadyHasLabelError);
        this.type = "bookmark-already-has-label";
        this.errorMessage = args[0];
    }
}

export class BookmarkDoesNotHaveLabelError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkDoesNotHaveLabelError);
        this.type = "bookmark-does-not-have-label";
        this.errorMessage = args[0];
    }
}

export class BookmarkLabelError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkLabelError);
        this.type = "bookmark-label-error";
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

export class LabelDoesNotExistError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, LabelDoesNotExistError);
        this.type = "label-does-not-exist";
        this.errorMessage = args[0];
    }
}

export class ListError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, ListError);
        this.type = "list-error";
        this.errorMessage = args[0];
    }
}

export class ListDoesNotExistError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, ListDoesNotExistError);
        this.type = "list-does-not-exist";
        this.errorMessage = args[0];
    }
}

export class BookmarkAlreadyInListError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkAlreadyInListError);
        this.type = "bookmark-already-in-list";
        this.errorMessage = args[0];
    }
}

export class BookmarkNotInListError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, BookmarkNotInListError);
        this.type = "bookmark-not-in-list";
        this.errorMessage = args[0];
    }
}

export class ImportExportError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, ImportExportError);
        this.type = "import-export-error";
        this.errorMessage = args[0];
    }
}

export class InvalidImportFormatError extends CustomError {
    public constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, InvalidImportFormatError);
        this.type = "invalid-import-format";
        this.errorMessage = args[0];
    }
}