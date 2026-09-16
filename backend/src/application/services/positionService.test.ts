import { getAllPositionsService, getCandidatesByPositionService } from './positionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    application: {
      findMany: jest.fn(),
    },
    position: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('getAllPositionsService', () => {
  it('should return the flattened list of positions with their company name', async () => {
    const mockPositions = [
      {
        id: 1,
        title: 'Senior Full-Stack Engineer',
        location: 'Remote',
        status: 'Open',
        applicationDeadline: new Date('2024-12-31'),
        company: { name: 'LTI' },
      },
    ];

    jest.spyOn(prisma.position, 'findMany').mockResolvedValue(mockPositions as any);

    const result = await getAllPositionsService();
    expect(result).toEqual([
      {
        id: 1,
        title: 'Senior Full-Stack Engineer',
        companyName: 'LTI',
        location: 'Remote',
        status: 'Open',
        applicationDeadline: new Date('2024-12-31'),
      },
    ]);
  });
});

describe('getCandidatesByPositionService', () => {
  it('should return candidates with their average scores', async () => {
    const mockApplications = [
      {
        id: 1,
        positionId: 1,
        candidateId: 1,
        applicationDate: new Date(),
        currentInterviewStep: 1,
        notes: null,
        candidate: { id: 1, firstName: 'John', lastName: 'Doe' },
        interviewStep: { name: 'Technical Interview' },
        interviews: [{ score: 5 }, { score: 3 }],
      },
    ];

    jest.spyOn(prisma.application, 'findMany').mockResolvedValue(mockApplications);

    const result = await getCandidatesByPositionService(1);
    expect(result).toEqual([
      {
        fullName: 'John Doe',
        currentInterviewStep: 'Technical Interview',
        averageScore: 4,
        id: 1,
        applicationId: 1,
      },
    ]);
  });
});

