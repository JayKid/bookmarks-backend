import { Request, Response } from "express";

class BookmarkHandler {
    public getBookmarks = (req: Request, res: Response) => {
        res.send('Hi bookmarks!');
    };
};

export default BookmarkHandler;