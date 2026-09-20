import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { Application } from '../../domain/models/Application';
import { getFirstInterviewStepForPosition } from './positionService';

const prisma = new PrismaClient();

export const addCandidate = async (candidateData: any) => {
    validateCandidateData(candidateData); // Validar los datos del candidato (lanza su propio Error con mensaje claro si falla)

    // Elegir posición es opcional: un candidato puede registrarse sin
    // candidatura todavía y quedar "sin asignar" (ver
    // getUnassignedCandidatesService más abajo) -- eso es un estado válido,
    // no un huérfano accidental. Lo que sigue siendo un error es indicar
    // una posición que no existe, o que existe pero no tiene ningún flujo
    // de entrevistas configurado.
    //
    // Cuando SÍ se indica, se valida ANTES de guardar nada del candidato.
    // Antes esta comprobación vivía al final, después de guardar candidato,
    // educación, experiencia y CV: un alta con una posición inexistente o
    // sin fases configuradas fallaba con 400 igualmente, pero dejaba un
    // candidato huérfano ya guardado en la base de datos, sin ninguna
    // Application, ocupando su email para siempre (confirmado con PoC:
    // POST /candidates contra una posición sin fases devuelve 400, y el
    // candidato aparece igualmente en la tabla Candidate).
    let firstStep = null;
    if (candidateData.positionId) {
        firstStep = await getFirstInterviewStepForPosition(candidateData.positionId);
        if (firstStep === undefined) {
            throw new Error('Selected position not found');
        }
        if (firstStep === null) {
            throw new Error('The selected position does not have an interview process configured');
        }
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.educations.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperiences.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }

        // Crear la candidatura a la posición elegida, en la primera fase de
        // su flujo de entrevistas -- sin esto, el candidato quedaba
        // guardado pero nunca aparecía en el tablero "Ver proceso" de
        // ninguna posición, porque ese tablero se alimenta de Application,
        // no de la lista general de candidatos. (firstStep ya se validó
        // arriba, antes de guardar nada.) Si no se eligió posición,
        // firstStep sigue siendo null aquí a propósito: el candidato se
        // queda guardado sin ninguna Application, sin asignar.
        if (firstStep) {
            const applicationModel = new Application({
                positionId: candidateData.positionId,
                candidateId,
                applicationDate: new Date(),
                currentInterviewStep: firstStep.id,
            });
            await applicationModel.save();
            candidate.applications.push(applicationModel);
        }

        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

// Candidatos guardados sin ninguna candidatura (ver la nota sobre
// positionId opcional en addCandidate) -- sin esto no existe ninguna
// pantalla en la app donde un candidato así pueda aparecer: Positions
// lista posiciones, y el tablero de cada posición solo lista candidatos
// con Application en esa posición concreta.
export const getUnassignedCandidatesService = async () => {
    const candidates = await prisma.candidate.findMany({
        where: { applications: { none: {} } },
        orderBy: { createdAt: 'desc' }
    });

    return candidates.map(candidate => ({
        id: candidate.id,
        fullName: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        createdAt: candidate.createdAt
    }));
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

export const updateCandidateStage = async (id: number, applicationIdNumber: number, currentInterviewStep: number) => {
    const application = await Application.findOneByPositionCandidateId(applicationIdNumber, id);
    if (!application) {
        throw new Error('Application not found');
    }

    // Actualizar solo la etapa de la entrevista actual de la aplicación específica
    application.currentInterviewStep = currentInterviewStep;

    // Guardar la aplicación actualizada
    await application.save();

    return application;
};