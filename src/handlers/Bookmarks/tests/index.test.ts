import BookmarksHandler from '../index';
import BookmarksService from '../../../services/Bookmarks';
import { BookmarkAlreadyExistsError, BookmarkError } from '../../../errors';
import { randomUUID } from 'crypto';

let bookmarksHandler: BookmarksHandler;
// @ts-ignore
let bookmarksService;

const getMockedUser = () => {
    return {
        user: {
            id: randomUUID(),
        }
    }
};

beforeEach(() => {
    bookmarksService = jest.mocked(BookmarksService, { shallow: false });
    // @ts-ignore
    bookmarksService.getBookmarks = jest.fn().mockReturnValue([]);
    // @ts-ignore
    bookmarksHandler = new BookmarksHandler(bookmarksService);
})

test('getBookmarks should call the service', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn(() => ({ json: jsonMocked }));
    const request: any = {
        ...getMockedUser()
    };
    const response: any = {
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
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser()
    };
    const response: any = {
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
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        body: {}
    };
    const response: any = {
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
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        body: {
            url: "notAValidURL"
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    await bookmarksHandler.addBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("invalid-url");
});

test('addBookmark should call the service with the right parameters and return the new bookmark', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        body: {
            url: "https://www.wikipedia.org/",
            title: "Wikipedia"
        }
    };
    const response: any = {
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
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        body: {
            url: "https://www.wikipedia.org/",
        }
    };
    const response: any = {
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
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        body: {
            url: "https://www.wikipedia.org/",
        }
    };
    const response: any = {
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