import { getAllPositions, getCandidatesByPosition, getInterviewFlowByPosition } from './positionController';
import { Request, Response } from 'express';
import { getAllPositionsService, getCandidatesByPositionService, getInterviewFlowByPositionService } from '../../application/services/positionService';

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
