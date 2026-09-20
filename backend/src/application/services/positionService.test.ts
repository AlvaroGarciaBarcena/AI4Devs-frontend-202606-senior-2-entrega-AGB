import { getAllPositionsService, getCandidatesByPositionService, addInterviewStepService } from './positionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    application: {
      findMany: jest.fn(),
    },
    position: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    // InterviewType/InterviewStep (domain/models/*.ts) instancian su propio
    // PrismaClient -- con este mock global, `new PrismaClient()` siempre
    // devuelve este mismo objeto, así que sus llamadas internas a
    // `prisma.interviewType.create`/`prisma.interviewStep.create` acaban
    // aquí también, no en un cliente real aparte.
    interviewType: {
      create: jest.fn(),
    },
    interviewStep: {
      create: jest.fn(),
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

describe('addInterviewStepService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new interview type and step, placed after the existing ones', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      interviewFlow: {
        id: 10,
        interviewSteps: [
          { id: 1, orderIndex: 1 },
          { id: 2, orderIndex: 2 },
        ],
      },
    } as any);
    jest.spyOn(prisma.interviewType, 'create').mockResolvedValue({ id: 99, name: 'Live coding test', description: undefined } as any);
    jest.spyOn(prisma.interviewStep, 'create').mockResolvedValue({
      id: 50,
      interviewFlowId: 10,
      interviewTypeId: 99,
      name: 'Live coding test',
      orderIndex: 3,
    } as any);

    const result = await addInterviewStepService(1, 'Live coding test');

    expect(prisma.interviewType.create).toHaveBeenCalledWith({ data: { name: 'Live coding test', description: undefined } });
    expect(prisma.interviewStep.create).toHaveBeenCalledWith({
      data: { interviewFlowId: 10, interviewTypeId: 99, name: 'Live coding test', orderIndex: 3 },
    });
    expect(result).toEqual({ id: 50, interviewFlowId: 10, interviewTypeId: 99, name: 'Live coding test', orderIndex: 3 });
  });

  // El flujo de la posición 2 llegó a estar vacío de fases de verdad (ver
  // el comentario del seed, sección 3.39) -- la primera fase que se añade
  // no debe intentar comparar contra un array vacío y explotar.
  it('starts at orderIndex 1 when the flow has no steps yet', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 2,
      interviewFlow: { id: 20, interviewSteps: [] },
    } as any);
    jest.spyOn(prisma.interviewType, 'create').mockResolvedValue({ id: 100, name: 'Primera fase' } as any);
    jest.spyOn(prisma.interviewStep, 'create').mockResolvedValue({
      id: 51,
      interviewFlowId: 20,
      interviewTypeId: 100,
      name: 'Primera fase',
      orderIndex: 1,
    } as any);

    const result = await addInterviewStepService(2, 'Primera fase');

    expect(prisma.interviewStep.create).toHaveBeenCalledWith({
      data: { interviewFlowId: 20, interviewTypeId: 100, name: 'Primera fase', orderIndex: 1 },
    });
    expect(result.orderIndex).toBe(1);
  });

  it('throws when the position does not exist', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(null);

    await expect(addInterviewStepService(999, 'Cualquier fase')).rejects.toThrow('Position not found');
    expect(prisma.interviewType.create).not.toHaveBeenCalled();
  });
});

