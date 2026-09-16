// Diccionario de todos los textos estáticos de la interfaz (etiquetas,
// botones, títulos, mensajes de estado...). Los mensajes de validación del
// backend tienen su propio mecanismo en validationMessages.js, porque se
// componen dinámicamente a partir de {field, code, params}; esto es solo
// para texto fijo conocido de antemano.

import { DEFAULT_LOCALE } from './locale';

const TRANSLATIONS = {
    es: {
        // Selector de idioma (visible en toda la app)
        'languageSwitcher.label': 'Idioma:',

        // Dashboard del reclutador
        'dashboard.title': 'Dashboard del Reclutador',
        'dashboard.logoAlt': 'Logo de LTI',
        'dashboard.addCandidate.heading': 'Añadir Candidato',
        'dashboard.addCandidate.button': 'Añadir Nuevo Candidato',
        'dashboard.viewPositions.heading': 'Ver Posiciones',
        'dashboard.viewPositions.button': 'Ir a Posiciones',

        // Formulario de alta de candidato
        'addCandidate.title': 'Agregar Candidato',
        'addCandidate.firstName': 'Nombre',
        'addCandidate.lastName': 'Apellido',
        'addCandidate.email': 'Correo Electrónico',
        'addCandidate.phone': 'Teléfono',
        'addCandidate.address': 'Dirección',
        'addCandidate.cv': 'CV',
        'addCandidate.addEducation': 'Añadir Educación',
        'addCandidate.addWorkExperience': 'Añadir Experiencia Laboral',
        'addCandidate.institutionPlaceholder': 'Institución',
        'addCandidate.titlePlaceholder': 'Título',
        'addCandidate.startDatePlaceholder': 'Fecha de Inicio',
        'addCandidate.endDatePlaceholder': 'Fecha de Fin',
        'addCandidate.companyPlaceholder': 'Empresa',
        'addCandidate.positionPlaceholder': 'Puesto',
        'addCandidate.remove': 'Eliminar',
        'addCandidate.submit': 'Enviar',
        'addCandidate.reviewFields': 'Revisa los siguientes campos:',
        'addCandidate.success': 'Candidato añadido con éxito',
        'addCandidate.genericErrorPrefix': 'Error al añadir candidato: ',

        // Subida de fichero
        'fileUploader.ariaLabel': 'Archivo',
        'fileUploader.selectedFile': 'Archivo seleccionado:',
        'fileUploader.upload': 'Subir Archivo',
        'fileUploader.success': 'Archivo subido con éxito',

        // Listado de posiciones
        'positions.title': 'Posiciones',
        'positions.searchByTitle': 'Buscar por título',
        'positions.searchByDate': 'Buscar por fecha',
        'positions.statusFilterLabel': 'Estado',
        'positions.status.open': 'Abierto',
        'positions.status.filled': 'Contratado',
        'positions.status.closed': 'Cerrado',
        'positions.status.draft': 'Borrador',
        'positions.company': 'Empresa:',
        'positions.location': 'Ubicación:',
        'positions.deadline': 'Deadline:',
        'positions.viewProcess': 'Ver proceso',
        'positions.edit': 'Editar',
        'positions.editNotImplemented': 'Edición de posiciones aún no implementada',
        'positions.empty': 'No hay posiciones disponibles.',
        'positions.fetchError': 'Error al obtener las posiciones',

        // Proceso de selección de una posición
        'positionProcess.back': '← Volver a posiciones',
        'positionProcess.title': 'Proceso de selección: ',
        'positionProcess.noFlow': 'Esta posición no tiene un flujo de entrevistas configurado.',
        'positionProcess.noCandidatesInStep': 'Sin candidatos en esta fase.',
        'positionProcess.averageScore': 'Puntuación media: ',
        'positionProcess.fetchError': 'Error al obtener el proceso de esta posición',
    },
    en: {
        'languageSwitcher.label': 'Language:',

        'dashboard.title': 'Recruiter Dashboard',
        'dashboard.logoAlt': 'LTI Logo',
        'dashboard.addCandidate.heading': 'Add Candidate',
        'dashboard.addCandidate.button': 'Add New Candidate',
        'dashboard.viewPositions.heading': 'View Positions',
        'dashboard.viewPositions.button': 'Go to Positions',

        'addCandidate.title': 'Add Candidate',
        'addCandidate.firstName': 'First Name',
        'addCandidate.lastName': 'Last Name',
        'addCandidate.email': 'Email',
        'addCandidate.phone': 'Phone',
        'addCandidate.address': 'Address',
        'addCandidate.cv': 'CV',
        'addCandidate.addEducation': 'Add Education',
        'addCandidate.addWorkExperience': 'Add Work Experience',
        'addCandidate.institutionPlaceholder': 'Institution',
        'addCandidate.titlePlaceholder': 'Title',
        'addCandidate.startDatePlaceholder': 'Start Date',
        'addCandidate.endDatePlaceholder': 'End Date',
        'addCandidate.companyPlaceholder': 'Company',
        'addCandidate.positionPlaceholder': 'Position',
        'addCandidate.remove': 'Remove',
        'addCandidate.submit': 'Submit',
        'addCandidate.reviewFields': 'Please review the following fields:',
        'addCandidate.success': 'Candidate added successfully',
        'addCandidate.genericErrorPrefix': 'Error adding candidate: ',

        'fileUploader.ariaLabel': 'File',
        'fileUploader.selectedFile': 'Selected file:',
        'fileUploader.upload': 'Upload File',
        'fileUploader.success': 'File uploaded successfully',

        'positions.title': 'Positions',
        'positions.searchByTitle': 'Search by title',
        'positions.searchByDate': 'Search by date',
        'positions.statusFilterLabel': 'Status',
        'positions.status.open': 'Open',
        'positions.status.filled': 'Filled',
        'positions.status.closed': 'Closed',
        'positions.status.draft': 'Draft',
        'positions.company': 'Company:',
        'positions.location': 'Location:',
        'positions.deadline': 'Deadline:',
        'positions.viewProcess': 'View process',
        'positions.edit': 'Edit',
        'positions.editNotImplemented': 'Editing positions is not implemented yet',
        'positions.empty': 'No positions available.',
        'positions.fetchError': 'Error fetching positions',

        // Proceso de selección de una posición
        'positionProcess.back': '← Back to positions',
        'positionProcess.title': 'Hiring process: ',
        'positionProcess.noFlow': 'This position does not have an interview flow configured.',
        'positionProcess.noCandidatesInStep': 'No candidates in this stage.',
        'positionProcess.averageScore': 'Average score: ',
        'positionProcess.fetchError': 'Error fetching this position\'s process',
    },
};

// key: string, params?: Record<string, string|number>
export const translate = (key, locale = DEFAULT_LOCALE, params = {}) => {
    const dict = TRANSLATIONS[locale] || TRANSLATIONS[DEFAULT_LOCALE];
    let text = dict[key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? key;
    Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{{${paramKey}}}`, value);
    });
    return text;
};
