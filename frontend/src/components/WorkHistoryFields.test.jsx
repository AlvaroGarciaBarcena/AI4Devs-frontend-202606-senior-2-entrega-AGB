import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkHistoryFields from './WorkHistoryFields';

const LABELS = {
    addEducation: 'Añadir Educación',
    addWorkExperience: 'Añadir Experiencia Laboral',
    institutionPlaceholder: 'Institución',
    titlePlaceholder: 'Título',
    startDatePlaceholder: 'Fecha de Inicio',
    endDatePlaceholder: 'Fecha de Fin',
    companyPlaceholder: 'Empresa',
    positionPlaceholder: 'Puesto',
    remove: 'Eliminar',
};

// Componente genérico (sin nada de este proyecto): a diferencia de
// PersonalDataFields, este SÍ lleva dentro la lógica de
// añadir/quitar/editar una entrada -- estos tests comprueban justo esa
// lógica, no solo que pinte bien.
describe('WorkHistoryFields', () => {
    it('adds a new empty education entry and reports it via onEducationsChange', async () => {
        const user = userEvent.setup();
        const handleEducationsChange = vi.fn();

        render(
            <WorkHistoryFields
                educations={[]}
                workExperiences={[]}
                onEducationsChange={handleEducationsChange}
                onWorkExperiencesChange={() => {}}
                labels={LABELS}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Añadir Educación' }));

        expect(handleEducationsChange).toHaveBeenCalledWith([
            { institution: '', title: '', startDate: '', endDate: '' },
        ]);
    });

    it('adds a new empty work experience entry and reports it via onWorkExperiencesChange', async () => {
        const user = userEvent.setup();
        const handleWorkExperiencesChange = vi.fn();

        render(
            <WorkHistoryFields
                educations={[]}
                workExperiences={[]}
                onEducationsChange={() => {}}
                onWorkExperiencesChange={handleWorkExperiencesChange}
                labels={LABELS}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Añadir Experiencia Laboral' }));

        expect(handleWorkExperiencesChange).toHaveBeenCalledWith([
            { company: '', position: '', description: '', startDate: '', endDate: '' },
        ]);
    });

    it('edits a text field of an existing education entry without touching the others', async () => {
        const user = userEvent.setup();
        const handleEducationsChange = vi.fn();
        const educations = [
            { institution: '', title: '', startDate: '', endDate: '' },
            { institution: 'MIT', title: '', startDate: '', endDate: '' },
        ];

        render(
            <WorkHistoryFields
                educations={educations}
                workExperiences={[]}
                onEducationsChange={handleEducationsChange}
                onWorkExperiencesChange={() => {}}
                labels={LABELS}
            />,
        );

        const institutionInputs = screen.getAllByPlaceholderText('Institución');
        await user.type(institutionInputs[0], 'X');

        expect(handleEducationsChange).toHaveBeenCalledWith([
            { institution: 'X', title: '', startDate: '', endDate: '' },
            { institution: 'MIT', title: '', startDate: '', endDate: '' },
        ]);
    });

    it('removes only the targeted work experience entry', async () => {
        const user = userEvent.setup();
        const handleWorkExperiencesChange = vi.fn();
        const workExperiences = [
            { company: 'Acme', position: '', description: '', startDate: '', endDate: '' },
            { company: 'Globex', position: '', description: '', startDate: '', endDate: '' },
        ];

        render(
            <WorkHistoryFields
                educations={[]}
                workExperiences={workExperiences}
                onEducationsChange={() => {}}
                onWorkExperiencesChange={handleWorkExperiencesChange}
                labels={LABELS}
            />,
        );

        const removeButtons = screen.getAllByRole('button', { name: /Eliminar/ });
        await user.click(removeButtons[0]);

        expect(handleWorkExperiencesChange).toHaveBeenCalledWith([
            { company: 'Globex', position: '', description: '', startDate: '', endDate: '' },
        ]);
    });

    it('reports which section/index/field changed via onFieldChanged, without knowing about validation', async () => {
        const user = userEvent.setup();
        const handleFieldChanged = vi.fn();
        const educations = [{ institution: '', title: '', startDate: '', endDate: '' }];

        render(
            <WorkHistoryFields
                educations={educations}
                workExperiences={[]}
                onEducationsChange={() => {}}
                onWorkExperiencesChange={() => {}}
                onFieldChanged={handleFieldChanged}
                labels={LABELS}
            />,
        );

        await user.type(screen.getByPlaceholderText('Institución'), 'X');

        expect(handleFieldChanged).toHaveBeenCalledWith('educations', 0, 'institution');
    });
});
