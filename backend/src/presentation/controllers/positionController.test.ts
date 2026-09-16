import { getAllPositions, getCandidatesByPosition } from './positionController';
import { Request, Response } from 'express';
import { getAllPositionsService, getCandidatesByPositionService } from '../../application/services/positionService';

jest.mock('../../application/services/positionService');

describe('getAllPositions', () => {
  it('should return 200 and the list of positions', async () => {
    const req = {} as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

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
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    (getCandidatesByPositionService as jest.Mock).mockResolvedValue([
      { fullName: 'John Doe', currentInterviewStep: 'Technical Interview', averageScore: 4 },
    ]);

    await getCandidatesByPosition(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { fullName: 'John Doe', currentInterviewStep: 'Technical Interview', averageScore: 4 },
    ]);
  });
});