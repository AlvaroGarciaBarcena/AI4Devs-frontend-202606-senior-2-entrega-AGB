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
    it('should return 200 and updated candidate stage', async () => {
      const req = { params: { id: '1' }, body: { applicationId: 1, currentInterviewStep: 2 } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      (updateCandidateStage as jest.Mock).mockResolvedValue({
        id: 1,
        applicationId: 1,
        candidateId: 1,
        currentInterviewStep: 2,
      });

      await updateCandidateStageController(req, res);

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
  });
