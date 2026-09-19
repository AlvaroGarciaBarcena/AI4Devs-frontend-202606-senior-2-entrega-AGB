import { PrismaClient, Prisma } from '@prisma/client';
import { Education } from './Education';
import { WorkExperience } from './WorkExperience';
import { Resume } from './Resume';
import { Application } from './Application';

const prisma = new PrismaClient();

export class Candidate {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    educations: Education[];
    workExperiences: WorkExperience[];
    resumes: Resume[];
    applications: Application[];

    constructor(data: any) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        // Copias, no alias del array del propio `data` -- candidateService.ts
        // recorre `candidateData.educations`/`workExperiences` (el mismo
        // `data` que llega aquí) con un for...of mientras va empujando cada
        // entrada ya guardada a `candidate.educations`/`workExperiences`. Si
        // fuera el mismo array, cada `push` añadía un elemento al array que
        // el propio for...of seguía recorriendo (los iteradores de Array sí
        // seven elementos añadidos durante la iteración) -- un candidato con
        // una sola entrada de educación producía un bucle infinito real,
        // insertando la misma fila una y otra vez (confirmado: se cortó tras
        // 204.963 filas duplicadas al matar el proceso a mano).
        this.educations = [...(data.educations || [])];
        this.workExperiences = [...(data.workExperiences || [])];
        this.resumes = data.resumes || [];
        this.applications = data.applications || [];
    }

    async save() {
        const candidateData: any = {};

        // Solo añadir al objeto candidateData los campos que no son undefined
        if (this.firstName !== undefined) candidateData.firstName = this.firstName;
        if (this.lastName !== undefined) candidateData.lastName = this.lastName;
        if (this.email !== undefined) candidateData.email = this.email;
        if (this.phone !== undefined) candidateData.phone = this.phone;
        if (this.address !== undefined) candidateData.address = this.address;

        // A diferencia de resumes/applications (más abajo), educations y
        // workExperiences NO se anidan aquí: candidateService.ts ya las
        // guarda por separado tras crear el candidato, usando las clases
        // Education/WorkExperience -- esas sí convierten startDate/endDate
        // a Date de verdad (`new Date(data.startDate)`), y tratan un
        // endDate vacío como "sin fecha de fin", no como una fecha
        // inválida. Este `create` anidado enviaba los strings del request
        // tal cual a Prisma, sin convertir: cualquier candidato con alguna
        // educación o experiencia hacía fallar prisma.candidate.create()
        // con "Expected ISO-8601 DateTime" (confirmado con PoC real), y si
        // alguna vez esto hubiera funcionado, habría creado cada entrada
        // DOS veces (aquí y en el bucle de candidateService.ts). Se quita
        // en vez de arreglarse aquí: ya existe una implementación correcta,
        // no hace falta una segunda.

        // Añadir resumes si hay alguno para añadir
        if (this.resumes.length > 0) {
            candidateData.resumes = {
                create: this.resumes.map(resume => ({
                    filePath: resume.filePath,
                    fileType: resume.fileType
                }))
            };
        }

        // Añadir applications si hay alguna para añadir
        if (this.applications.length > 0) {
            candidateData.applications = {
                create: this.applications.map(app => ({
                    positionId: app.positionId,
                    candidateId: app.candidateId,
                    applicationDate: app.applicationDate,
                    currentInterviewStep: app.currentInterviewStep,
                    notes: app.notes,
                }))
            };
        }

        if (this.id) {
            // Actualizar un candidato existente
            try {
                return await prisma.candidate.update({
                    where: { id: this.id },
                    data: candidateData
                });
            } catch (error: any) {
                console.log(error);
                if (error instanceof Prisma.PrismaClientInitializationError) {
                    // Database connection error
                    throw new Error('No se pudo conectar con la base de datos. Por favor, asegúrese de que el servidor de base de datos esté en ejecución.');
                } else if (error.code === 'P2025') {
                    // Record not found error
                    throw new Error('No se pudo encontrar el registro del candidato con el ID proporcionado.');
                } else {
                    throw error;
                }
            }
        } else {
            // Crear un nuevo candidato
            try {
                const result = await prisma.candidate.create({
                    data: candidateData
                });
                return result;
            } catch (error: any) {
                if (error instanceof Prisma.PrismaClientInitializationError) {
                    // Database connection error
                    throw new Error('No se pudo conectar con la base de datos. Por favor, asegúrese de que el servidor de base de datos esté en ejecución.');
                } else {
                    throw error;
                }
            }
        }
    }

    static async findOne(id: number): Promise<Candidate | null> {
        const data = await prisma.candidate.findUnique({
            where: { id: id },
            include: {
                educations: true,
                workExperiences: true,
                resumes: true,
                applications: {
                    include: {
                        position: {
                            select: {
                                id: true,
                                title: true
                            }
                        },
                        interviews: {
                            select: {
                                interviewDate: true,
                                interviewStep: {
                                    select: {
                                        name: true
                                    }
                                },
                                notes: true,
                                score: true
                            }
                        }
                    }
                }
            }
        });
        if (!data) return null;
        return new Candidate(data);
    }
}
