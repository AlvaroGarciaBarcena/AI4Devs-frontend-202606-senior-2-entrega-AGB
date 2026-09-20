import { addCandidateController, updateCandidateStageController } from './candidateController';
import { Request, Response } from 'express';
import { addCandidate, updateCandidateStage } from '../../application/services/candidateService';
import { ValidationError } from '../../application/validator';

jest.mock('../../application/services/candidateService');

beforeEach(() => {
    jest.clearAllMocks();
});

const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
}) as unknown as Response;

describe('addCandidateController', () => {
    it('returns 201 with the created candidate on success', async () => {
        const req = { body: { firstName: 'Ana', lastName: 'García', email: 'ana@example.com' } } as unknown as Request;
        const res = mockResponse();

        (addCandidate as jest.Mock).mockResolvedValue({ id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@example.com' });

        await addCandidateController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Candidate added successfully',
            data: { id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@example.com' },
        });
    });

    // El caso más verificado a mano durante toda la sesión (curl y navegador):
    // un apellido con un carácter no permitido debe devolver el código de
    // validación estructurado, no un mensaje genérico.
    it('returns 400 with the structured issues when the last name contains an underscore', async () => {
        const req = { body: { firstName: 'Juan', lastName: 'Garcia_', email: 'juan@example.com' } } as unknown as Request;
        const res = mockResponse();

        const validationError = new ValidationError([
            { field: 'lastName', code: 'invalidCharacters', params: { char: '_' } },
        ]);
        (addCandidate as jest.Mock).mockRejectedValue(validationError);

        await addCandidateController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Validation failed',
            errors: [{ field: 'lastName', code: 'invalidCharacters', params: { char: '_' } }],
        });
    });

    it('accumulates every failing field in the same response, not just the first one', async () => {
        const req = { body: { firstName: '', lastName: '', email: 'not-an-email' } } as unknown as Request;
        const res = mockResponse();

        const validationError = new ValidationError([
            { field: 'firstName', code: 'required' },
            { field: 'lastName', code: 'required' },
            { field: 'email', code: 'invalidFormat' },
        ]);
        (addCandidate as jest.Mock).mockRejectedValue(validationError);

        await addCandidateController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errors: [
                    { field: 'firstName', code: 'required' },
                    { field: 'lastName', code: 'required' },
                    { field: 'email', code: 'invalidFormat' },
                ],
            }),
        );
    });

    it('returns 400 with a plain message for non-validation errors (e.g. a duplicate email)', async () => {
        const req = { body: { firstName: 'Ana', lastName: 'García', email: 'ana@example.com' } } as unknown as Request;
        const res = mockResponse();

        (addCandidate as jest.Mock).mockRejectedValue(new Error('The email already exists in the database'));

        await addCandidateController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Error adding candidate',
            error: 'The email already exists in the database',
        });
    });
});

describe('updateCandidateStageController', () => {
    // requireAuth (ya delante de toda /candidates) siempre deja
    // req.employee puesto antes de llegar aquí -- se simula igual en cada
    // test de este describe.
    const authenticatedReq = (body: object) => ({ params: { id: '1' }, body, employee: { sub: 7, role: 'Interviewer', companyId: 1 } }) as unknown as Request;

    it('should return 200 and updated candidate stage, passing the score and the employee from the token', async () => {
      const req = authenticatedReq({ applicationId: 1, currentInterviewStep: 2, score: 5 });
      const res = mockResponse();

      (updateCandidateStage as jest.Mock).mockResolvedValue({
        id: 1,
        applicationId: 1,
        candidateId: 1,
        currentInterviewStep: 2,
      });

      await updateCandidateStageController(req, res);

      expect(updateCandidateStage).toHaveBeenCalledWith(1, 1, 2, 7, 5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Candidate stage updated successfully',
        data: {
          id: 1,
          applicationId: 1,
          candidateId: 1,
          currentInterviewStep: 2,
        },
      });
    });

    // Pedido por el usuario: omitir la puntuación no debe bloquear el
    // movimiento -- solo no se puntúa (ver candidateService.ts).
    it('moves the candidate without a score when none is given', async () => {
      const req = authenticatedReq({ applicationId: 1, currentInterviewStep: 2 });
      const res = mockResponse();

      (updateCandidateStage as jest.Mock).mockResolvedValue({ id: 1 });

      await updateCandidateStageController(req, res);

      expect(updateCandidateStage).toHaveBeenCalledWith(1, 1, 2, 7, undefined);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 without calling the service when the score is negative', async () => {
      const req = authenticatedReq({ applicationId: 1, currentInterviewStep: 2, score: -1 });
      const res = mockResponse();

      await updateCandidateStageController(req, res);

      expect(updateCandidateStage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 without calling the service when the score is not an integer', async () => {
      const req = authenticatedReq({ applicationId: 1, currentInterviewStep: 2, score: 'excellent' });
      const res = mockResponse();

      await updateCandidateStageController(req, res);

      expect(updateCandidateStage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
