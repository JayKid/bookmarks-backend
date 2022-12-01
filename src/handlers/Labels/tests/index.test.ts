import LabelsHandler from '../index';
import LabelsService from '../../../services/Labels';
import { LabelError } from '../../../errors';
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