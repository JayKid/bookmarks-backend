import LabelsHandler from '../index';
import LabelsService from '../../../services/Labels';
import { LabelDoesNotExistError, LabelError } from '../../../errors';
import { randomUUID } from 'crypto';

let labelsHandler: LabelsHandler;
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
    labelsService = jest.mocked(LabelsService, { shallow: false });
    // @ts-ignore
    labelsService.getLabels = jest.fn().mockReturnValue([]);
    // @ts-ignore
    labelsHandler = new LabelsHandler(labelsService);
})

test('getLabels should call the service', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn(() => ({ json: jsonMocked }));
    const request: any = {
        ...getMockedUser()
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    await labelsHandler.getLabels(request, response);
    // @ts-ignore
    expect(labelsService.getLabels).toHaveBeenCalled();
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(jsonMocked).toHaveBeenCalledWith({ labels: [] });
});

test('getLabels should call return an error when something went wrong', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser()
    };
    const response: any = {
        status: statusMocked
    };

    const labelError = new LabelError();

    // @ts-ignore
    labelsService.getLabels = jest.fn().mockReturnValue(labelError);

    // @ts-ignore
    await labelsHandler.getLabels(request, response);
    // @ts-ignore
    expect(labelsService.getLabels).toHaveBeenCalled();
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("label-fetch-error");
});

test('createLabel should return an error when no name is provided', async () => {
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
    labelsService.createLabel = jest.fn();

    // @ts-ignore
    await labelsHandler.createLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-name");
});

test('createLabel should call the service with the right parameters and return the new label', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        body: {
            name: "newLabel",
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = {};
    const mockedCreateLabel = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    labelsService.createLabel = mockedCreateLabel;

    // @ts-ignore
    await labelsHandler.createLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(mockedCreateLabel).toHaveBeenCalledWith({ name: request.body.name, userId: request.user.id });
    expect(jsonMocked).toHaveBeenCalledWith({ label: returnValue });
});

test('createLabel should handle an unknown error when creating the label', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        body: {
            name: "newerLabel",
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new LabelError();
    // @ts-ignore
    labelsService.createLabel = jest.fn().mockReturnValue(returnValue);

    // @ts-ignore
    await labelsHandler.createLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("label-creation-error");
});

test('updateLabel should return an error when provided an invalid name', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID(),
        },
        body: {
            name: "",
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    await labelsHandler.updateLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("invalid-name");
});

test('updateLabel should return an error when the label does not exist', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID()
        },
        body: {
            name: "newerLabel",
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(new LabelDoesNotExistError());

    // @ts-ignore
    await labelsHandler.updateLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("label-not-exists");
});

test('updateLabel should return an error when the label is not owned by the user', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID()
        },
        body: {
            name: "newerLabel",
        }
    };
    const response: any = {
        status: statusMocked
    };

    // @ts-ignore
    labelsService.updateLabel = jest.fn();
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(false);

    // @ts-ignore
    await labelsHandler.updateLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(403);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("forbidden-access-to-label");
});

test('updateLabel should handle an unknown error when creating the label', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID(),
        },
        body: {
            name: "newerLabel",
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new LabelError();
    // @ts-ignore
    labelsService.updateLabel = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await labelsHandler.updateLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("label-error");
});

test('updateLabel should call the service with the right parameters and return the updated label', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID(),
        },
        body: {
            name: "newerLabel",
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = {};
    const mockedUpdateLabel = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    labelsService.updateLabel = mockedUpdateLabel
    // @ts-ignore
    labelsService.isOwner = jest.fn().mockReturnValue(true);

    // @ts-ignore
    await labelsHandler.updateLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(mockedUpdateLabel).toHaveBeenCalledWith(request.params.labelId, { name: request.body.name });
    expect(jsonMocked).toHaveBeenCalledWith({ label: returnValue });
});

test('deleteLabel should return an error when no labelId is provided', async () => {
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
    labelsService.createLabel = jest.fn();

    // @ts-ignore
    await labelsHandler.deleteLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(400);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("missing-label-id");
});

test('deleteLabel should call the service with the right parameters and return 200', async () => {
    const jsonMocked = jest.fn();
    const sendMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked, send: sendMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = {};
    const mockedDeleteLabel = jest.fn().mockReturnValue(returnValue);
    // @ts-ignore
    labelsService.deleteLabel = mockedDeleteLabel;

    // @ts-ignore
    await labelsHandler.deleteLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(200);
    expect(mockedDeleteLabel).toHaveBeenCalledWith({ labelId: request.params.labelId, userId: request.user.id });
    expect(sendMocked).toHaveBeenCalled();
});

test('deleteLabel should return an error when the label does not exist', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new LabelDoesNotExistError();
    // @ts-ignore
    labelsService.deleteLabel = jest.fn().mockReturnValue(returnValue);

    // @ts-ignore
    await labelsHandler.deleteLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(404);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("label-not-exists");
});

test('deleteLabel should handle an unknown error when deleting the label', async () => {
    const jsonMocked = jest.fn();
    const statusMocked = jest.fn().mockReturnValue({ json: jsonMocked });
    const request: any = {
        ...getMockedUser(),
        params: {
            labelId: randomUUID(),
        }
    };
    const response: any = {
        status: statusMocked
    };

    const returnValue = new LabelError();
    // @ts-ignore
    labelsService.deleteLabel = jest.fn().mockReturnValue(returnValue);

    // @ts-ignore
    await labelsHandler.deleteLabel(request, response);
    // @ts-ignore
    expect(statusMocked).toHaveBeenCalledWith(500);
    expect(jsonMocked.mock.lastCall[0].error.type).toBe("label-error");
});