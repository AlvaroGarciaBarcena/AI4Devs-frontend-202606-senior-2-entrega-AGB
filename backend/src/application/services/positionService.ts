import { PrismaClient } from '@prisma/client';
import { Position } from '../../domain/models/Position';

const prisma = new PrismaClient();

const calculateAverageScore = (interviews: any[]) => {
    if (interviews.length === 0) return 0;
    const totalScore = interviews.reduce((acc, interview) => acc + (interview.score || 0), 0);
    return totalScore / interviews.length;
};

export const getAllPositionsService = async () => {
    const positions = await prisma.position.findMany({
        include: {
            company: {
                select: { name: true }
            }
        },
        orderBy: { id: 'asc' }
    });

    return positions.map(position => ({
        id: position.id,
        title: position.title,
        companyName: position.company.name,
        location: position.location,
        status: position.status,
        applicationDeadline: position.applicationDeadline
    }));
};

export const getCandidatesByPositionService = async (positionId: number) => {
    try {
        const applications = await prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: true,
                interviews: true,
                interviewStep: true
            }
        });

        return applications.map(app => ({
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep.name,
            averageScore: calculateAverageScore(app.interviews),
            id: app.candidate.id,
            applicationId: app.id
        }));
    } catch (error) {
        console.error('Error retrieving candidates by position:', error);
        throw new Error('Error retrieving candidates by position');
    }
};

// Usado al dar de alta un candidato con una posición elegida
// (candidateService.ts): toda candidatura nueva arranca en la primera
// fase del flujo de entrevistas de esa posición. `orderBy` es necesario
// -- el `include` de Prisma no garantiza que interviewSteps venga en el
// orden de `orderIndex`, y sin ordenar explícitamente se podría escoger
// una fase intermedia como si fuera la primera.
//
// `undefined` (posición inexistente) y `null` (posición real, pero sin
// ninguna fase configurada en su flujo) se distinguen a propósito: son
// dos fallos distintos y quien llama (candidateService.ts) necesita
// poder dar un mensaje que no los confunda.
export const getFirstInterviewStepForPosition = async (positionId: number) => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            interviewFlow: {
                include: {
                    interviewSteps: { orderBy: { orderIndex: 'asc' } }
                }
            }
        }
    });

    if (!position) return undefined;
    return position.interviewFlow.interviewSteps[0] ?? null;
};

export const getInterviewFlowByPositionService = async (positionId: number) => {
    const positionWithInterviewFlow = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            interviewFlow: {
                include: {
                    interviewSteps: true
                }
            }
        }
    });

    if (!positionWithInterviewFlow) {
        throw new Error('Position not found');
    }

    // Formatear la respuesta para incluir el nombre de la posición y el flujo de entrevistas
    return {
        positionName: positionWithInterviewFlow.title,
        interviewFlow: {
            id: positionWithInterviewFlow.interviewFlow.id,
            description: positionWithInterviewFlow.interviewFlow.description,
            interviewSteps: positionWithInterviewFlow.interviewFlow.interviewSteps.map(step => ({
                id: step.id,
                interviewFlowId: step.interviewFlowId,
                interviewTypeId: step.interviewTypeId,
                name: step.name,
                orderIndex: step.orderIndex
            }))
        }
    };
};
