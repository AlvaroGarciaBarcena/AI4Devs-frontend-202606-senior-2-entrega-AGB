## Purpose

Muestra toda la interfaz en el idioma que prefiere quien la usa, detectándolo automáticamente y permitiendo cambiarlo explícitamente en cualquier momento.

## ADDED Requirements

### Requirement: Detección automática del idioma
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `b5e3b7b`)_

El sistema SHALL detectar el idioma preferido a partir de la lista completa de idiomas configurados en el navegador (no solo el primero), usando español o inglés según cuál coincida, con inglés como idioma por defecto si ninguno coincide.

#### Scenario: Navegador con varios idiomas configurados
- **WHEN** el navegador tiene configurada una lista de idiomas en la que el español no es el primero pero sí aparece en la lista
- **THEN** el sistema detecta español como idioma inicial

### Requirement: Selector de idioma explícito
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `86df0ff`)_

El sistema SHALL ofrecer un selector visible con las opciones Español/English, y SHALL dar prioridad a la elección explícita del usuario sobre la detección automática, persistiendo esa elección entre visitas.

#### Scenario: Cambio manual de idioma
- **WHEN** el usuario pulsa el botón "English" del selector
- **THEN** toda la interfaz cambia a inglés de inmediato, y ese idioma se mantiene en visitas posteriores aunque el navegador siga configurado en otro idioma

### Requirement: Toda la interfaz está traducida, no solo los mensajes de validación
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `eea6e5a`)_

El sistema SHALL mostrar en el idioma activo todos los textos visibles de la interfaz — títulos, etiquetas de campos, botones y mensajes de estado — no únicamente los mensajes de error de validación.

#### Scenario: Cambio de idioma con un formulario a medio rellenar
- **WHEN** el usuario cambia el idioma mientras tiene datos ya escritos en un formulario
- **THEN** las etiquetas, botones y mensajes visibles cambian de idioma sin que se pierdan los datos ya introducidos

### Requirement: Los mensajes de error ya visibles se retraducen sin reenviar
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `f120a08`)_

El sistema SHALL recomponer, en el nuevo idioma, cualquier mensaje de error de validación que ya estuviera visible en pantalla al cambiar de idioma, sin necesidad de repetir la petición que lo generó.

#### Scenario: Cambiar de idioma con un error visible
- **WHEN** un envío fallido muestra un mensaje de error en español y el usuario cambia el idioma a inglés sin corregir nada
- **THEN** el mismo mensaje de error se muestra en inglés, sin que el formulario se haya reenviado
