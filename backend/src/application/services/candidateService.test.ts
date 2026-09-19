import { addCandidate, updateCandidateStage } from './candidateService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Los distintos modelos de dominio que toca addCandidate (Candidate,
// Application, Position vía positionService) hacen cada uno su propio
// `new PrismaClient()` -- con este mock, todos comparten la misma
// instancia simulada, así que hace falta declarar aquí los métodos de
// cada uno que se vaya a necesitar, no solo los de `application`.
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    candidate: {
      create: jest.fn(),
    },
    position: {
      findUnique: jest.fn(),
    },
    application: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('addCandidate', () => {
  const baseCandidateData = {
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@example.com',
    positionId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso que motivó este cambio: antes, un candidato se guardaba pero
  // nunca quedaba vinculado a ninguna posición, así que no aparecía en el
  // tablero "Ver proceso" de ninguna. Ahora addCandidate crea también la
  // Application, en la primera fase (por orderIndex) del flujo de
  // entrevistas de la posición elegida.
  it('creates an Application in the first interview step of the chosen position', async () => {
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue({ id: 10, ...baseCandidateData } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      interviewFlow: {
        interviewSteps: [
          { id: 100, orderIndex: 1, name: 'Initial Screening' },
          { id: 101, orderIndex: 2, name: 'Technical Interview' },
        ],
      },
    } as any);
    jest.spyOn(prisma.application, 'create').mockResolvedValue({
      id: 500,
      positionId: 1,
      candidateId: 10,
      currentInterviewStep: 100,
      applicationDate: new Date(),
      notes: null,
    });

    await addCandidate(baseCandidateData);

    expect(prisma.position.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    expect(prisma.application.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ positionId: 1, candidateId: 10, currentInterviewStep: 100 }),
    });
  });

  it('throws a clear error when the selected position has no interview steps configured', async () => {
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue({ id: 10, ...baseCandidateData } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      interviewFlow: { interviewSteps: [] },
    } as any);

    await expect(addCandidate(baseCandidateData)).rejects.toThrow('does not have an interview process configured');
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  // Distinto del caso de arriba a propósito: una posición inexistente y
  // una posición real sin fases configuradas son dos fallos distintos, y
  // no deberían compartir el mismo mensaje (ver positionService.ts).
  it('throws a distinct error when the selected position does not exist', async () => {
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue({ id: 10, ...baseCandidateData } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(null as any);

    await expect(addCandidate(baseCandidateData)).rejects.toThrow('Selected position not found');
    expect(prisma.application.create).not.toHaveBeenCalled();
  });
});

describe('updateCandidateStage', () => {
  it('should update the candidate stage and return the updated application', async () => {
    const mockApplication = {
      id: 1,
      positionId: 1,
      candidateId: 1,
      currentInterviewStep: 1,
      applicationDate: new Date(),
      notes: null,
    };

    jest.spyOn(prisma.application, 'findFirst').mockResolvedValue(mockApplication);
    jest.spyOn(prisma.application, 'update').mockResolvedValue({
      ...mockApplication,
      currentInterviewStep: 2,
    });

    const result = await updateCandidateStage(1, 1, 2);
    expect(result).toEqual(expect.objectContaining({
      ...mockApplication,
      currentInterviewStep: 2,
    }));
  });
});