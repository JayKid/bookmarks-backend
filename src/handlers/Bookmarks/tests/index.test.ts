import BookmarksHandler from '../index';
import BookmarksService from '../../../services/Bookmarks';
import { BookmarkError } from '../../../errors';

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

    const errorMessage = "foo";
    const bookmarkError = new BookmarkError(errorMessage)

    // @ts-ignore
    bookmarksService.getBookmarks = jest.fn().mockReturnValue(bookmarkError);

    // @ts-ignore
    await bookmarksHandler.getBookmarks(request, response);
    // @ts-ignore
    expect(bookmarksService.getBookmarks).toHaveBeenCalled();
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked).toHaveBeenCalledWith({ message: errorMessage });
});