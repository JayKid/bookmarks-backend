import BookmarksHandler from '../index';
import BookmarksService from '../../../services/Bookmarks';
import LabelsService from '../../../services/Labels';
import { BookmarkAlreadyExistsError, BookmarkAlreadyHasLabelError, BookmarkDoesNotExistError, BookmarkDoesNotHaveLabelError, BookmarkError, LabelDoesNotExistError } from '../../../errors';
import { randomUUID } from 'crypto';

let bookmarksHandler: BookmarksHandler;
// @ts-ignore
let bookmarksService;
// @ts-ignore
let labelsService;

const getMockedUser = () => {
    return {
        user: {
            id: randomUUID(),
        }
    }
};

beforeEach(() => {
    bookmarksService = jest.mocked(BookmarksService, { shallow: false });
    labelsService = jest.mocked(LabelsService, { shallow: false });
    // @ts-ignore
    bookmarksService.getBookmarks = jest.fn().mockReturnValue([]);
    // @ts-ignore
    bookmarksHandler = new BookmarksHandler(bookmarksService, labelsService);
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

test('updateBookmark should return an error when no bookmarkId is provided', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {},
        body: {
            url: "https://www.wikipedia.org/",
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.updateBookmark = jest.fn();

    // @ts-ignore
    await bookmarksHandler.updateBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-bookmark-id");
});

test('updateBookmark should return an error when provided an invalid URL', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
        },
        body: {
            url: "",
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.updateBookmark = jest.fn();

    // @ts-ignore
    await bookmarksHandler.updateBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("invalid-url");
});

test('updateBookmark should return an error when the bookmark does not exist', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
        },
        body: {
            url: "https://www.wikipedia.org/",
            title: "The updated bookmark title",
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkDoesNotExistError()
    // @ts-ignore
    bookmarksService.updateBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(returnValue);

    // @ts-ignore
    await bookmarksHandler.updateBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-does-not-exist");
});

test('updateBookmark should return an error when the bookmark is not owned by the user', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
        },
        body: {
            url: "https://www.wikipedia.org/",
            title: "The updated bookmark title",
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkError();
    // @ts-ignore
    bookmarksService.updateBookmark = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(false);

    // @ts-ignore
    await bookmarksHandler.updateBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(403);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("forbidden-access-to-bookmark");
});

test('updateBookmark should handle an unknown error when updating the bookmark', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
        },
        body: {
            url: "https://www.wikipedia.org/",
            title: "The updated bookmark title",
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkError();
    // @ts-ignore
    bookmarksService.updateBookmark = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await bookmarksHandler.updateBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-error");
});

test('updateBookmark should call the service with the right parameters and return the updated bookmark', async () => {
    const jsonMocked = jest.fn();
    const sendMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked, send: sendMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
        },
        body: {
            url: "https://www.wikipedia.org/",
            title: "The updated bookmark title",
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = {};
    const mockedUpdateBookmark = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    bookmarksService.updateBookmark = mockedUpdateBookmark;
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await bookmarksHandler.updateBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(mockedUpdateBookmark).toHaveBeenCalledWith(request.params.bookmarkId, { url: request.body.url, title: request.body.title });
    expect(sendMocked).toHaveBeenCalled();
});

test('deleteBookmark should return an error when no bookmarkId is provided', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {}
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.deleteBookmark = jest.fn();

    // @ts-ignore
    await bookmarksHandler.deleteBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-bookmark-id");
});

test('deleteBookmark should return an error when the bookmark does not exist', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID()
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkDoesNotExistError()
    // @ts-ignore
    bookmarksService.deleteBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(returnValue);

    // @ts-ignore
    await bookmarksHandler.deleteBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-does-not-exist");
});

test('deleteBookmark should return an error when the bookmark is not owned by the user', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID()
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.deleteBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(false);

    // @ts-ignore
    await bookmarksHandler.deleteBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(403);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("forbidden-access-to-bookmark");
});

test('deleteBookmark should handle an unknown error when deleting the bookmark', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID()
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkError();
    // @ts-ignore
    bookmarksService.deleteBookmark = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await bookmarksHandler.deleteBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-error");
});

test('deleteBookmark should call the service with the right parameters and return 200', async () => {
    const jsonMocked = jest.fn();
    const sendMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked, send: sendMocked });

    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID()
        }
    };
    const response: any = {
        status: statusMocked
    };

    const mockedDeleteBookmark = jest.fn().mockReturnValue(false);
    // @ts-ignore
    bookmarksService.deleteBookmark = mockedDeleteBookmark;
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await bookmarksHandler.deleteBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(mockedDeleteBookmark).toHaveBeenCalledWith(request.params.bookmarkId);
    expect(sendMocked).toHaveBeenCalled();
});

test('addLabelToBookmark should return an error when no bookmarkId is provided', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID()
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.addLabelToBookmark = jest.fn();

    // @ts-ignore
    await bookmarksHandler.addLabelToBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-bookmark-id");
});

test('addLabelToBookmark should return an error when no labelId is provided', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.addLabelToBookmark = jest.fn();

    // @ts-ignore
    await bookmarksHandler.addLabelToBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-label-id");
});

test('addLabelToBookmark should return an error when the bookmark is not owned by the user', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.addLabelToBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(false);

    // @ts-ignore
    await bookmarksHandler.addLabelToBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(403);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("forbidden-access-to-bookmark");
});

test('addLabelToBookmark should return an error when the bookmark does not exist', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.addLabelToBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(new BookmarkDoesNotExistError());

    // @ts-ignore
    await bookmarksHandler.addLabelToBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-does-not-exist");
});

test('addLabelToBookmark should return an error when the label is not owned by the user', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.addLabelToBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(false);

    // @ts-ignore
    await bookmarksHandler.addLabelToBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(403);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("forbidden-access-to-label");
});

test('addLabelToBookmark should return an error when the label does not exist', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.addLabelToBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(new LabelDoesNotExistError());

    // @ts-ignore
    await bookmarksHandler.addLabelToBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("label-does-not-exist");
});

test('addLabelToBookmark should return an error when the bookmark already has the label', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkAlreadyHasLabelError();
    // @ts-ignore
    bookmarksService.addLabelToBookmark = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await bookmarksHandler.addLabelToBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-already-has-label");
});

test('addLabelToBookmark should call the service with the right parameters and return the new bookmark', async () => {
    const jsonMocked = jest.fn();
    const sendMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked, send: sendMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = {};
    const mockedAddLabelToBookmark = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    bookmarksService.addLabelToBookmark = mockedAddLabelToBookmark;
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await bookmarksHandler.addLabelToBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(mockedAddLabelToBookmark).toHaveBeenCalledWith({ bookmarkId: request.params.bookmarkId, labelId: request.params.labelId, userId: request.user.id });
    expect(sendMocked).toHaveBeenCalled();
});

test('removeLabelFromBookmark should return an error when no bookmarkId is provided', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID()
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.removeLabelFromBookmark = jest.fn();

    // @ts-ignore
    await bookmarksHandler.removeLabelFromBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-bookmark-id");
});

test('removeLabelFromBookmark should return an error when no labelId is provided', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.removeLabelFromBookmark = jest.fn();

    // @ts-ignore
    await bookmarksHandler.removeLabelFromBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-label-id");
});

test('removeLabelFromBookmark should return an error when the bookmark is not owned by the user', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.removeLabelFromBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(false);

    // @ts-ignore
    await bookmarksHandler.removeLabelFromBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(403);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("forbidden-access-to-bookmark");
});

test('removeLabelFromBookmark should return an error when the bookmark does not exist', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.removeLabelFromBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(new BookmarkDoesNotExistError());

    // @ts-ignore
    await bookmarksHandler.removeLabelFromBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-does-not-exist");
});

test('removeLabelFromBookmark should return an error when the label is not owned by the user', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.removeLabelFromBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(false);

    // @ts-ignore
    await bookmarksHandler.removeLabelFromBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(403);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("forbidden-access-to-label");
});

test('removeLabelFromBookmark should return an error when the label does not exist', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    bookmarksService.removeLabelFromBookmark = jest.fn();
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(new LabelDoesNotExistError());

    // @ts-ignore
    await bookmarksHandler.removeLabelFromBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("label-does-not-exist");
});

test('removeLabelFromBookmark should return an error when the bookmark does not have the label', async () => {
    const jsonMocked = jest.fn();
    const sendMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked, send: sendMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new BookmarkDoesNotHaveLabelError();
    // @ts-ignore
    bookmarksService.removeLabelFromBookmark = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await bookmarksHandler.removeLabelFromBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("bookmark-does-not-have-label");
});

test('removeLabelFromBookmark should call the service with the right parameters and return 200', async () => {
    const jsonMocked = jest.fn();
    const sendMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked, send: sendMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            bookmarkId: randomUUID(),
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = {};
    const mockedRemoveLabelFromBookmark = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    bookmarksService.removeLabelFromBookmark = mockedRemoveLabelFromBookmark;
    // @ts-ignore
    bookmarksService.isOwner = jest.fn().mockReturnValue(true);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await bookmarksHandler.removeLabelFromBookmark(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(mockedRemoveLabelFromBookmark).toHaveBeenCalledWith({ bookmarkId: request.params.bookmarkId, labelId: request.params.labelId, userId: request.user.id });
    expect(sendMocked).toHaveBeenCalled();
});