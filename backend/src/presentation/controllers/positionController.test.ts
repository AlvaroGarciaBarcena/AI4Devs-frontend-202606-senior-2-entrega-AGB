import { getAllPositions, getCandidatesByPosition, getInterviewFlowByPosition, addInterviewStep } from './positionController';
import { Request, Response } from 'express';
import { getAllPositionsService, getCandidatesByPositionService, getInterviewFlowByPositionService, addInterviewStepService } from '../../application/services/positionService';

jest.mock('../../application/services/positionService');

beforeEach(() => {
  jest.clearAllMocks();
});

const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
}) as unknown as Response;

describe('getAllPositions', () => {
  it('should return 200 and the list of positions', async () => {
    const req = {} as unknown as Request;
    const res = mockResponse();

    (getAllPositionsService as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Senior Full-Stack Engineer', companyName: 'LTI', location: 'Remote', status: 'Open', applicationDeadline: new Date('2024-12-31') },
    ]);

    await getAllPositions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { id: 1, title: 'Senior Full-Stack Engineer', companyName: 'LTI', location: 'Remote', status: 'Open', applicationDeadline: new Date('2024-12-31') },
    ]);
  });
});

describe('getCandidatesByPosition', () => {
  it('should return 200 and candidates data', async () => {
    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    (getCandidatesByPositionService as jest.Mock).mockResolvedValue([
      { fullName: 'John Doe', currentInterviewStep: 'Technical Interview', averageScore: 4 },
    ]);

    await getCandidatesByPosition(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { fullName: 'John Doe', currentInterviewStep: 'Technical Interview', averageScore: 4 },
    ]);
  });

  // Verificado a mano con `curl http://localhost:3010/position/abc/candidates`
  // durante la sesión (backend-AGB, sección 3.6): antes de ese arreglo, un id
  // no numérico llegaba a Prisma como NaN y daba un 500 poco claro.
  it('returns 400 without calling the service when the id is not numeric', async () => {
    const req = { params: { id: 'abc' } } as unknown as Request;
    const res = mockResponse();

    await getCandidatesByPosition(req, res);

    expect(getCandidatesByPositionService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid position ID format' });
  });
});

describe('getInterviewFlowByPosition', () => {
  it('should return 200 with the interview flow', async () => {
    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    (getInterviewFlowByPositionService as jest.Mock).mockResolvedValue({
      positionName: 'Senior Full-Stack Engineer',
      interviewFlow: { id: 1, description: null, interviewSteps: [] },
    });

    await getInterviewFlowByPosition(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      interviewFlow: {
        positionName: 'Senior Full-Stack Engineer',
        interviewFlow: { id: 1, description: null, interviewSteps: [] },
      },
    });
  });

  it('returns 400 without calling the service when the id is not numeric', async () => {
    const req = { params: { id: 'abc' } } as unknown as Request;
    const res = mockResponse();

    await getInterviewFlowByPosition(req, res);

    expect(getInterviewFlowByPositionService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid position ID format' });
  });

  // Verificado a mano navegando a /positions/999 (positions-proceso-AGB,
  // sección 4): una posición inexistente debe dar 404, no un 500.
  it('returns 404 when the position does not exist', async () => {
    const req = { params: { id: '999' } } as unknown as Request;
    const res = mockResponse();

    (getInterviewFlowByPositionService as jest.Mock).mockRejectedValue(new Error('Position not found'));

    await getInterviewFlowByPosition(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Position not found', error: 'Position not found' });
  });
});

describe('addInterviewStep', () => {
  it('returns 201 with the created step', async () => {
    const req = { params: { id: '1' }, body: { name: 'Live coding test' } } as unknown as Request;
    const res = mockResponse();

    (addInterviewStepService as jest.Mock).mockResolvedValue({
      id: 50, interviewFlowId: 10, interviewTypeId: 99, name: 'Live coding test', orderIndex: 3,
    });

    await addInterviewStep(req, res);

    expect(addInterviewStepService).toHaveBeenCalledWith(1, 'Live coding test');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Interview step added successfully',
      data: { id: 50, interviewFlowId: 10, interviewTypeId: 99, name: 'Live coding test', orderIndex: 3 },
    });
  });

  it('returns 400 without calling the service when the id is not numeric', async () => {
    const req = { params: { id: 'abc' }, body: { name: 'Live coding test' } } as unknown as Request;
    const res = mockResponse();

    await addInterviewStep(req, res);

    expect(addInterviewStepService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid position ID format' });
  });

  it('returns 400 without calling the service when the name is blank', async () => {
    const req = { params: { id: '1' }, body: { name: '   ' } } as unknown as Request;
    const res = mockResponse();

    await addInterviewStep(req, res);

    expect(addInterviewStepService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Phase name is required' });
  });

  it('returns 400 without calling the service when the name is too long', async () => {
    const req = { params: { id: '1' }, body: { name: 'a'.repeat(101) } } as unknown as Request;
    const res = mockResponse();

    await addInterviewStep(req, res);

    expect(addInterviewStepService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when the position does not exist', async () => {
    const req = { params: { id: '999' }, body: { name: 'Live coding test' } } as unknown as Request;
    const res = mockResponse();

    (addInterviewStepService as jest.Mock).mockRejectedValue(new Error('Position not found'));

    await addInterviewStep(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Position not found', error: 'Position not found' });
  });
});
