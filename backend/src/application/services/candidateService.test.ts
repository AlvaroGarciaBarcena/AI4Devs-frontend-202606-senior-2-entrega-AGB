import { addCandidate, getUnassignedCandidatesService, updateCandidateProfile, updateCandidateStage } from './candidateService';
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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    education: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    workExperience: {
      create: jest.fn(),
      deleteMany: jest.fn(),
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

  // Regresión de un bucle infinito real: Candidate guardaba
  // `this.educations = data.educations` (el mismo array, no una copia).
  // candidateService recorre ese array con un for...of mientras empuja
  // cada entrada ya guardada a `candidate.educations` -- como era el
  // mismo array, cada `push` alargaba el array que el propio for...of
  // seguía recorriendo, así que nunca terminaba: una sola entrada de
  // educación producía inserciones sin fin (confirmado contra la base de
  // datos real: 204.963 filas duplicadas antes de matar el proceso a
  // mano). Este test falla si esa duplicación de array vuelve a colarse.
  it('saves exactly one Education row per education entry, however many are pushed onto candidate.educations afterwards', async () => {
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue({ id: 10, ...baseCandidateData } as any);
    jest.spyOn(prisma.education, 'create').mockResolvedValue({ id: 1 } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      interviewFlow: { interviewSteps: [{ id: 100, orderIndex: 1, name: 'Initial Screening' }] },
    } as any);
    jest.spyOn(prisma.application, 'create').mockResolvedValue({ id: 500 } as any);

    await addCandidate({
      ...baseCandidateData,
      educations: [{ institution: 'Uni X', title: 'Grado X', startDate: '2018-09-01', endDate: '2020-09-01' }],
    });

    expect(prisma.education.create).toHaveBeenCalledTimes(1);
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

  // Antes la posición se comprobaba al final, después de guardar el
  // candidato: un alta rechazada por este motivo dejaba igualmente un
  // candidato huérfano en la base de datos (PoC real documentado en
  // prompts-AGB.md). Ahora la posición se valida antes de guardar nada.
  it('does not save the candidate at all when the selected position has no interview steps configured', async () => {
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue({ id: 10, ...baseCandidateData } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      interviewFlow: { interviewSteps: [] },
    } as any);

    await expect(addCandidate(baseCandidateData)).rejects.toThrow('does not have an interview process configured');
    expect(prisma.candidate.create).not.toHaveBeenCalled();
  });

  // Distinto del caso de arriba a propósito: una posición inexistente y
  // una posición real sin fases configuradas son dos fallos distintos, y
  // no deberían compartir el mismo mensaje (ver positionService.ts).
  it('throws a distinct error when the selected position does not exist', async () => {
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue({ id: 10, ...baseCandidateData } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(null as any);

    await expect(addCandidate(baseCandidateData)).rejects.toThrow('Selected position not found');
    expect(prisma.application.create).not.toHaveBeenCalled();
    expect(prisma.candidate.create).not.toHaveBeenCalled();
  });

  // Caso pedido por el usuario tras probarlo a mano: un candidato dado de
  // alta sin elegir posición debe guardarse igualmente, sin ninguna
  // Application ni comprobación de posición -- "sin asignar" es un estado
  // válido, no un error.
  it('saves the candidate without creating an Application or checking any position when positionId is not provided', async () => {
    const { positionId, ...withoutPositionId } = baseCandidateData;
    jest.spyOn(prisma.candidate, 'create').mockResolvedValue({ id: 10, ...withoutPositionId } as any);

    await addCandidate(withoutPositionId);

    expect(prisma.candidate.create).toHaveBeenCalledTimes(1);
    expect(prisma.position.findUnique).not.toHaveBeenCalled();
    expect(prisma.application.create).not.toHaveBeenCalled();
  });
});

describe('getUnassignedCandidatesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists candidates with no application, most recently registered first', async () => {
    jest.spyOn(prisma.candidate, 'findMany').mockResolvedValue([
      { id: 18, firstName: 'Bad', lastName: 'Position', email: 'bad.position3@example.com', createdAt: new Date('2026-09-19') },
      { id: 10, firstName: 'Nombre', lastName: 'Apellido', email: 'nombre1apellido1@email.com', createdAt: new Date('2026-09-10') },
    ] as any);

    const result = await getUnassignedCandidatesService();

    expect(prisma.candidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { applications: { none: {} } } }),
    );
    expect(result).toEqual([
      { id: 18, fullName: 'Bad Position', email: 'bad.position3@example.com', createdAt: new Date('2026-09-19') },
      { id: 10, fullName: 'Nombre Apellido', email: 'nombre1apellido1@email.com', createdAt: new Date('2026-09-10') },
    ]);
  });
});

describe('updateCandidateProfile', () => {
  const existingCandidate = {
    id: 20,
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@example.com',
    phone: null,
    address: null,
  };
  const updateData = {
    firstName: 'Ana',
    lastName: 'García Actualizada',
    email: 'ana.garcia@example.com',
    phone: '612345678',
    address: 'Nueva dirección',
    educations: [{ institution: 'MIT', title: 'BSc', startDate: '2018-01-01', endDate: '2020-01-01' }],
    workExperiences: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the personal fields and replaces educations/workExperiences wholesale', async () => {
    jest.spyOn(prisma.candidate, 'findUnique')
      .mockResolvedValueOnce({ ...existingCandidate, applications: [] } as any) // comprobación de candidatura existente
      .mockResolvedValueOnce({ ...existingCandidate, ...updateData, educations: [], workExperiences: [], resumes: [], applications: [] } as any); // Candidate.findOne al final
    jest.spyOn(prisma.candidate, 'update').mockResolvedValue(existingCandidate as any);
    jest.spyOn(prisma.education, 'deleteMany').mockResolvedValue({ count: 1 } as any);
    jest.spyOn(prisma.education, 'create').mockResolvedValue({ id: 1 } as any);
    jest.spyOn(prisma.workExperience, 'deleteMany').mockResolvedValue({ count: 0 } as any);

    await updateCandidateProfile(20, updateData);

    expect(prisma.candidate.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        firstName: 'Ana',
        lastName: 'García Actualizada',
        phone: '612345678',
        address: 'Nueva dirección',
      }),
    });
    // Las listas se sustituyen enteras: se borran todas las entradas
    // anteriores del candidato y se recrean las que llegan en el payload,
    // no se intenta adivinar cuáles "son la misma" entrada de antes.
    expect(prisma.education.deleteMany).toHaveBeenCalledWith({ where: { candidateId: 20 } });
    expect(prisma.education.create).toHaveBeenCalledTimes(1);
    expect(prisma.workExperience.deleteMany).toHaveBeenCalledWith({ where: { candidateId: 20 } });
  });

  it('assigns a position when the candidate did not have one yet', async () => {
    jest.spyOn(prisma.candidate, 'findUnique')
      .mockResolvedValueOnce({ ...existingCandidate, applications: [] } as any)
      .mockResolvedValueOnce({ ...existingCandidate, educations: [], workExperiences: [], resumes: [], applications: [] } as any);
    jest.spyOn(prisma.candidate, 'update').mockResolvedValue(existingCandidate as any);
    jest.spyOn(prisma.education, 'deleteMany').mockResolvedValue({ count: 0 } as any);
    jest.spyOn(prisma.workExperience, 'deleteMany').mockResolvedValue({ count: 0 } as any);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue({
      id: 1,
      interviewFlow: { interviewSteps: [{ id: 100, orderIndex: 1, name: 'Initial Screening' }] },
    } as any);
    jest.spyOn(prisma.application, 'create').mockResolvedValue({ id: 500 } as any);

    await updateCandidateProfile(20, { ...updateData, positionId: 1 });

    expect(prisma.application.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ positionId: 1, candidateId: 20, currentInterviewStep: 100 }),
    });
  });

  // Regla explícita: reasignar la posición de un candidato que ya tiene
  // candidatura no se soporta desde esta edición (ver el comentario junto
  // a updateCandidateProfile en candidateService.ts) -- Interview.
  // applicationId es RESTRICT, borrar esa Application a medias podría
  // dejar el candidato en un estado inconsistente.
  it('rejects changing the position of a candidate that already has an application', async () => {
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValueOnce({
      ...existingCandidate,
      applications: [{ id: 1, positionId: 1, candidateId: 20 }],
    } as any);

    await expect(updateCandidateProfile(20, { ...updateData, positionId: 2 }))
      .rejects.toThrow('Cannot change the position');
    expect(prisma.candidate.update).not.toHaveBeenCalled();
  });

  it('throws a clear error when the candidate does not exist', async () => {
    jest.spyOn(prisma.candidate, 'findUnique').mockResolvedValueOnce(null as any);

    await expect(updateCandidateProfile(999, updateData)).rejects.toThrow('Candidate not found');
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