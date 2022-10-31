import BookmarksHandler from '../index';
import BookmarksService from '../../../services/Bookmarks';
import { BookmarkAlreadyExistsError, BookmarkError } from '../../../errors';

let bookmarksHandler: BookmarksHandler;
// @ts-ignore
let bookmarksService;

beforeEach(() => {
    bookmarksService = jest.mocked(BookmarksService, { shallow: false });
    // @ts-ignore
    bookmarksService.getBookmarks = jest.fn().mockReturnValue([]);
    // @ts-ignore
    bookmarksHandler = new BookmarksHandler(bookmarksService);
})

test('getBookmarks should call the service', async () => {
    let jsonMocked = jest.fn();
    let statusMocked = jest.fn(() => ({ json: jsonMocked }));
    let request: any = {};
    let response: any = {
        status: statusMocked
    };

    // @ts-ignore
    await bookmarksHandler.getBookmarks(request, response);
    // @ts-ignore
    expect(bookmarksService.getBookmarks).toHaveBeenCalled();
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(jsonMocked).toHaveBeenCalledWith({ bookmarks: [] });
});

test('getBookmarks should call return an error when something went wrong', async () => {
    let jsonMocked = jest.fn();
    let statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    let request: any = {};
    let response: any = {
        status: statusMocked
    };

    const bookmarkError = new BookmarkError();

    // @ts-ignore
    bookmarksService.getBookmarks = jest.fn().mockReturnValue(bookmarkError);

    // @ts-ignore
    await bookmarksHandler.getBookmarks(request, response);
    // @ts-ignore
    expect(bookmarksService.getBookmarks).toHaveBeenCalled();
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-fetch-error");
});

test('addBookmark should return an error when no URL is provided', async () => {
    let jsonMocked = jest.fn();
    let statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    let request: any = {
        body: {}
    };
    let response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.addBookmark = jest.fn();

    // @ts-ignore
    await bookmarksHandler.addBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-url");
});

test('addBookmark should return an error when provided an invalid URL', async () => {
    // Empty URL validation
    let jsonMocked = jest.fn();
    let statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    let request: any = {
        body: {
            url: "notAValidURL"
        }
    };
    let response: any = {
        status: statusMocked
    };

    // @ts-ignore
    await bookmarksHandler.addBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("invalid-url");
});

test('addBookmark should call the service with the right parameters and return the new bookmark', async () => {
    let jsonMocked = jest.fn();
    let statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    let request: any = {
        body: {
            url: "https://www.wikipedia.org/",
            title: "Wikipedia"
        }
    };
    let response: any = {
        status: statusMocked
    };

    const returnValue = {};
    // @ts-ignore
    bookmarksService.addBookmark = jest.fn().mockReturnValue(returnValue);

    // @ts-ignore
    await bookmarksHandler.addBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(jsonMocked).toHaveBeenCalledWith({ bookmark: returnValue });
});

test('addBookmark should return an error when the bookmark already exists', async () => {
    let jsonMocked = jest.fn();
    let statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    let request: any = {
        body: {
            url: "https://www.wikipedia.org/",
        }
    };
    let response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkAlreadyExistsError();
    // @ts-ignore
    bookmarksService.addBookmark = jest.fn().mockReturnValue(returnValue);

    // @ts-ignore
    await bookmarksHandler.addBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-already-exists");
});

test('addBookmark should handle an unknown error when creating the bookmark', async () => {
    let jsonMocked = jest.fn();
    let statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    let request: any = {
        body: {
            url: "https://www.wikipedia.org/",
        }
    };
    let response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkError();
    // @ts-ignore
    bookmarksService.addBookmark = jest.fn().mockReturnValue(returnValue);

    // @ts-ignore
    await bookmarksHandler.addBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-creation-error");
});