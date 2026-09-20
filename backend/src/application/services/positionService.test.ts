import { getAllPositionsService, getCandidatesByPositionService, addInterviewStepService, getFirstInterviewStepForPosition, getInterviewFlowByPositionService } from './positionService';
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

const COMPANY_ID = 1;
const OTHER_COMPANY_ID = 2;

describe('getAllPositionsService', () => {
  it('should return the flattened list of positions with their company name, scoped to the caller\'s company', async () => {
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

    const result = await getAllPositionsService(COMPANY_ID);

    // Hallazgo real, sección 3.61: sin este filtro, el listado devolvía
    // posiciones de cualquier empresa, no solo la del empleado autenticado.
    expect(prisma.position.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: COMPANY_ID } }),
    );
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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({ id: 1, companyId: COMPANY_ID } as any);
  });

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

    const result = await getCandidatesByPositionService(1, COMPANY_ID);
    expect(result).toEqual([
      {
        fullName: 'John Doe',
        currentInterviewStep: 'Technical Interview',
        averageScore: 4,
        ungradedInterviews: 0,
        id: 1,
        applicationId: 1,
      },
    ]);
  });

  // El motivo de esta rama: una fase completada sin puntuación (`score`
  // en null, ver candidateService.ts) no debe hundir la media -- antes,
  // `interview.score || 0` la contaba como un cero en la suma, pero SÍ en
  // el divisor.
  it('excludes ungraded interviews from the average instead of counting them as zero', async () => {
    const mockApplications = [
      {
        id: 2,
        candidate: { id: 2, firstName: 'Ana', lastName: 'García' },
        interviewStep: { name: 'Technical Interview' },
        interviews: [{ score: 4 }, { score: null }, { score: null }],
      },
    ];

    jest.spyOn(prisma.application, 'findMany').mockResolvedValue(mockApplications as any);

    const result = await getCandidatesByPositionService(1, COMPANY_ID);

    expect(result[0].averageScore).toBe(4);
    expect(result[0].ungradedInterviews).toBe(2);
  });

  it('returns an average of 0 and no ungraded count when there are no interviews at all', async () => {
    const mockApplications = [
      {
        id: 3,
        candidate: { id: 3, firstName: 'Nico', lastName: 'Alaslla' },
        interviewStep: { name: 'Initial Screening' },
        interviews: [],
      },
    ];

    jest.spyOn(prisma.application, 'findMany').mockResolvedValue(mockApplications as any);

    const result = await getCandidatesByPositionService(1, COMPANY_ID);

    expect(result[0].averageScore).toBe(0);
    expect(result[0].ungradedInterviews).toBe(0);
  });

  // Hallazgo real con PoC, sección 3.61: un empleado de una empresa podía
  // leer los candidatos de una posición de OTRA empresa con solo conocer
  // su id.
  it('throws "Position not found" (not the candidates) when the position belongs to another company', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({ id: 1, companyId: OTHER_COMPANY_ID } as any);

    await expect(getCandidatesByPositionService(1, COMPANY_ID)).rejects.toThrow('Position not found');
    expect(prisma.application.findMany).not.toHaveBeenCalled();
  });

  it('throws "Position not found" when the position does not exist at all', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(null);

    await expect(getCandidatesByPositionService(999, COMPANY_ID)).rejects.toThrow('Position not found');
  });
});

describe('getFirstInterviewStepForPosition', () => {
  it('returns undefined when the position belongs to another company, same as if it did not exist', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      companyId: OTHER_COMPANY_ID,
      interviewFlow: { interviewSteps: [{ id: 1, orderIndex: 1 }] },
    } as any);

    const result = await getFirstInterviewStepForPosition(1, COMPANY_ID);

    expect(result).toBeUndefined();
  });

  it('returns the first step (by orderIndex) when the position belongs to the caller\'s company', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      companyId: COMPANY_ID,
      interviewFlow: { interviewSteps: [{ id: 2, orderIndex: 1 }] },
    } as any);

    const result = await getFirstInterviewStepForPosition(1, COMPANY_ID);

    expect(result).toEqual({ id: 2, orderIndex: 1 });
  });
});

describe('getInterviewFlowByPositionService', () => {
  it('throws "Position not found" when the position belongs to another company', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      companyId: OTHER_COMPANY_ID,
      title: 'CEO secreto de la empresa rival',
      interviewFlow: { id: 1, description: null, interviewSteps: [] },
    } as any);

    await expect(getInterviewFlowByPositionService(1, COMPANY_ID)).rejects.toThrow('Position not found');
  });
});

describe('addInterviewStepService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new interview type and step, placed after the existing ones', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      companyId: COMPANY_ID,
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

    const result = await addInterviewStepService(1, 'Live coding test', COMPANY_ID);

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
      companyId: COMPANY_ID,
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

    const result = await addInterviewStepService(2, 'Primera fase', COMPANY_ID);

    expect(prisma.interviewStep.create).toHaveBeenCalledWith({
      data: { interviewFlowId: 20, interviewTypeId: 100, name: 'Primera fase', orderIndex: 1 },
    });
    expect(result.orderIndex).toBe(1);
  });

  it('throws when the position does not exist', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(null);

    await expect(addInterviewStepService(999, 'Cualquier fase', COMPANY_ID)).rejects.toThrow('Position not found');
    expect(prisma.interviewType.create).not.toHaveBeenCalled();
  });

  // Hallazgo real con PoC, sección 3.61: así fue como se demostró el
  // fallo -- Alice (companyId 1) añadía una fase a una posición de otra
  // empresa y recibía 201 Created.
  it('throws "Position not found" (does not create anything) when the position belongs to another company', async () => {
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 72,
      companyId: OTHER_COMPANY_ID,
      interviewFlow: { id: 72, interviewSteps: [] },
    } as any);

    await expect(addInterviewStepService(72, 'Fase inyectada', COMPANY_ID)).rejects.toThrow('Position not found');
    expect(prisma.interviewType.create).not.toHaveBeenCalled();
    expect(prisma.interviewStep.create).not.toHaveBeenCalled();
  });
});
