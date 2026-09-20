import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from './FileUploader';
import i18n from '../i18n/i18n';

// Antes de esta rama, FileUploader llamaba siempre a uploadCV importado
// directamente de candidateService -- solo servía para subir CVs de
// candidatos, en esta app. Ahora recibe la función de subida por prop
// (`uploadFn`), así que este test comprueba justo eso: que es el
// componente quien decide a qué endpoint sube, no FileUploader.
beforeEach(async () => {
    await i18n.changeLanguage('es');
});

const selectFile = async (user, file) => {
    const input = screen.getByLabelText(i18n.t('fileUploader.ariaLabel'));
    await user.upload(input, file);
};

describe('FileUploader', () => {
    it('calls the injected uploadFn (not a hardcoded endpoint) when uploading', async () => {
        const user = userEvent.setup();
        const uploadFn = vi.fn().mockResolvedValue({ filePath: '/uploads/cv.pdf', fileType: 'application/pdf' });
        const onUpload = vi.fn();
        const file = new File(['contenido'], 'cv.pdf', { type: 'application/pdf' });

        render(<FileUploader onChange={() => {}} onUpload={onUpload} uploadFn={uploadFn} />);
        await selectFile(user, file);
        await user.click(screen.getByRole('button', { name: i18n.t('fileUploader.upload') }));

        await waitFor(() => {
            expect(uploadFn).toHaveBeenCalledWith(file);
        });
        expect(onUpload).toHaveBeenCalledWith({ filePath: '/uploads/cv.pdf', fileType: 'application/pdf' });
    });

    it('shows the error message when uploadFn rejects', async () => {
        const user = userEvent.setup();
        const uploadFn = vi.fn().mockRejectedValue(new Error('Archivo demasiado grande'));
        const file = new File(['contenido'], 'cv.pdf', { type: 'application/pdf' });

        render(<FileUploader onChange={() => {}} onUpload={() => {}} uploadFn={uploadFn} />);
        await selectFile(user, file);
        await user.click(screen.getByRole('button', { name: i18n.t('fileUploader.upload') }));

        await waitFor(() => {
            expect(screen.getByText('Archivo demasiado grande')).toBeTruthy();
        });
    });
});
