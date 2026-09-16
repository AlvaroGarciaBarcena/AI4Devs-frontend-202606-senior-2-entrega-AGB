/**
 * Google Apps Script para actualizar automáticamente la presentación en Google Slides:
 * "TESTING 2: AUTOMATED TESTS Y QA: E2E Testing e IA Agéntica"
 * 
 * INSTRUCCIONES DE USO EN GOOGLE SLIDES (1 minuto):
 * 1. Abre tu presentación: https://docs.google.com/presentation/d/1IiT9moRBj6Ido7ClOtOibWKaO9E3sdYvQ4-srmrN_J8/edit
 * 2. En el menú superior, haz clic en: Extensiones -> Apps Script (o Herramientas -> Editor de secuencias de comandos).
 * 3. Borra cualquier código existente y pega todo este archivo.
 * 4. Haz clic en "Guardar" (icono de disquete) y luego en "Ejecutar" (Run).
 * 5. Si Google pide autorización ("Revisar permisos"), concédela (Avanzado -> Ir a Proyecto -> Permitir).
 * 6. ¡Listo! Todas las diapositivas se actualizarán al instante con la nueva estructura de 2 partes y 5 fases.
 */

function actualizarPresentacionE2E() {
  var pres = SlidesApp.getActivePresentation();
  var slides = pres.getSlides();

  Logger.log("Total de diapositivas detectadas: " + slides.length);

  // -------------------------------------------------------------
  // SLIDE 4: Estrategia de Calidad y Framework de 5 Fases
  // -------------------------------------------------------------
  if (slides.length >= 4) {
    var slide4 = slides[3];
    actualizarTextoEnSlide(slide4, "Estrategia de Calidad", "Estrategia de Calidad: Diseñar para el Éxito con IA");
    
    // Añadimos el recuadro del Framework de 5 Fases
    var shape5Fases = slide4.insertShape(SlidesApp.ShapeType.RECTANGLE, 150, 480, 980, 180);
    shape5Fases.getFill().setSolidFill("#0F172A");
    shape5Fases.getBorder().setTransparent();
    var txt4 = shape5Fases.getText();
    txt4.setText("EL FRAMEWORK DE 5 FASES PARA E2E CON IA\n" +
                 "1. Preparar el Repo: Semántica y Accesibilidad (AOM) como API nativa para la IA.\n" +
                 "2. Dar Contexto: Especificación funcional clara (criterios BS-01 a BS-04) y estado determinista.\n" +
                 "3. Fijar el Harness: Servidor Playwright MCP, prohibición de selectores CSS frágiles y mocks.\n" +
                 "4. Generar con el Agente: Enfoque Semántico (AOM / Playwright) vs Visión Multimodal (Midscene).\n" +
                 "5. Verificar con Criterio: Calidad más allá del verde mediante Test Mutation en vivo.");
    txt4.getTextStyle().setFontFamily("Urbanist").setFontSize(13).setForegroundColor("#F8FAFC");
    txt4.getParagraphs()[0].getTextStyle().setFontSize(14).setBold(true).setForegroundColor("#FACC15");
  }

  // -------------------------------------------------------------
  // SLIDE 6: AOM vs DOM (Conexión con Playwright MCP)
  // -------------------------------------------------------------
  if (slides.length >= 6) {
    var slide6 = slides[5];
    // Añadimos caja destacada inferior explicando cómo el agente accede al AOM
    var shapeMCP = slide6.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 150, 580, 980, 100);
    shapeMCP.getFill().setSolidFill("#1E3A8A");
    shapeMCP.getBorder().setSolidFill("#38BDF8");
    var txt6 = shapeMCP.getText();
    txt6.setText("💡 ¿Cómo consume el Agente el AOM?\n" +
                 "A través del Playwright MCP Server (@playwright/mcp), el agente recibe el árbol de accesibilidad en formato semántico ligero vía stdio, operando con getByRole('searchbox') y getByRole('button') sin selectores CSS frágiles ni visión costosa.");
    txt6.getTextStyle().setFontFamily("Urbanist").setFontSize(12).setForegroundColor("#FFFFFF");
    txt6.getParagraphs()[0].getTextStyle().setFontSize(13).setBold(true).setForegroundColor("#FACC15");
  }

  // -------------------------------------------------------------
  // SLIDE 8: PARTE 1 - Configuración 1: Playwright + MCP Agéntico
  // -------------------------------------------------------------
  if (slides.length >= 8) {
    var slide8 = slides[7];
    actualizarTextoEnSlide(slide8, "1. Cypress: Rapidez y DX", "PARTE 1: Configuración 1: Playwright + MCP Agéntico");
    actualizarTextoEnSlide(slide8, "Cypress", "Playwright MCP");
    
    var shapeConfig1 = slide8.insertShape(SlidesApp.ShapeType.RECTANGLE, 150, 220, 980, 420);
    shapeConfig1.getFill().setSolidFill("#0F172A");
    shapeConfig1.getBorder().setTransparent();
    var txt8 = shapeConfig1.getText();
    txt8.setText("Configuración 1: Playwright + MCP Agéntico (AOM / Antigravity)\n\n" +
                 "• Protocolo MCP (@playwright/mcp): Conexión bidireccional nativa por stdio que dota al LLM de herramientas de navegador.\n" +
                 "• Interacción Semántica por Roles AOM: El agente opera con getByRole('searchbox'), getByRole('button') y regiones aria-live.\n" +
                 "• Generación en Vivo: Antigravity inspecciona la aplicación abierta, prueba interacciones y sintetiza el test en TypeScript nativo.\n" +
                 "• Determinismo en CI: Pruebas nativas que se ejecutan a velocidad de máquina en CI/CD con coste $0 de tokens en runtime.\n\n" +
                 "Caso Práctico en Vivo: Exploración y generación del test E2E del buscador de candidatos (CandidateSearch.tsx).");
    txt8.getTextStyle().setFontFamily("Urbanist").setFontSize(15).setForegroundColor("#E2E8F0");
    txt8.getParagraphs()[0].getTextStyle().setFontSize(22).setBold(true).setForegroundColor("#38BDF8");
  }

  // -------------------------------------------------------------
  // SLIDE 9: PARTE 2 - Industrialización con npx playwright init-agents
  // -------------------------------------------------------------
  if (slides.length >= 9) {
    var slide9 = slides[8];
    actualizarTextoEnSlide(slide9, "2. Playwright: Potencia Industrial", "PARTE 2: Industrialización con npx playwright init-agents");
    
    var shapeConfig2 = slide9.insertShape(SlidesApp.ShapeType.RECTANGLE, 150, 220, 980, 420);
    shapeConfig2.getFill().setSolidFill("#0F172A");
    shapeConfig2.getBorder().setTransparent();
    var txt9 = shapeConfig2.getText();
    txt9.setText("Industrialización Agéntica: npx playwright init-agents\n" +
                 "Comando oficial: npx playwright init-agents --loop=<vscode|claude|codex>\n\n" +
                 "La Tríada Oficial de Agentes Autónomos de Playwright:\n" +
                 "• 🗺️ Planner Agent: Explora autónomamente la UI viva y redacta un plan de pruebas en Markdown (test-plan.md).\n" +
                 "• ⚙️ Generator Agent: Transforma el plan Markdown en código .spec.ts validando locators y aserciones en vivo.\n" +
                 "• 🩹 Healer Agent (Self-Healing): Diagnostica tests fallidos y auto-repara selectores ante cambios en el frontend.\n\n" +
                 "El Arnés seed.spec.ts: El punto de entrada humano que proporciona estado limpio, mocks y estabilidad a los agentes.");
    txt9.getTextStyle().setFontFamily("Urbanist").setFontSize(15).setForegroundColor("#E2E8F0");
    txt9.getParagraphs()[0].getTextStyle().setFontSize(22).setBold(true).setForegroundColor("#FACC15");
    txt9.getParagraphs()[1].getTextStyle().setFontSize(13).setForegroundColor("#94A3B8");
  }

  // -------------------------------------------------------------
  // SLIDE 10: Configuración 2: Testing Multimodal con Visión (Midscene)
  // -------------------------------------------------------------
  if (slides.length >= 10) {
    var slide10 = slides[9];
    actualizarTextoEnSlide(slide10, "3. Midscene: Visión Multimodal", "Configuración 2: Testing Multimodal con Visión (Midscene)");
    
    var shapeMidscene = slide10.insertShape(SlidesApp.ShapeType.RECTANGLE, 150, 220, 980, 420);
    shapeMidscene.getFill().setSolidFill("#0F172A");
    shapeMidscene.getBorder().setTransparent();
    var txt10 = shapeMidscene.getText();
    txt10.setText("Testing Basado en Visión: Midscene (Set-of-Mark & GPT-4o)\n\n" +
                  "• Zero Selectors: La IA inspecciona la pantalla mediante capturas visuales procesadas con etiquetas numéricas (SoM).\n" +
                  "• Lenguaje Natural: .ai('buscar candidato \"José\"') y .aiAssert('ver 1 de 3 candidatos').\n\n" +
                  "AOM/MCP vs Visión Multimodal (Criterio para Seniors):\n" +
                  "• Playwright MCP & Agents: Máxima velocidad, coste $0 en CI, 100% determinista. Ideal para SPAs y diseño atómico accesible.\n" +
                  "• Midscene (Visión): Mayor latencia y coste en tokens. Ideal para Canvas, WebGL, flujos exploratorios o UIs sin semántica.");
    txt10.getTextStyle().setFontFamily("Urbanist").setFontSize(15).setForegroundColor("#E2E8F0");
    txt10.getParagraphs()[0].getTextStyle().setFontSize(22).setBold(true).setForegroundColor("#38BDF8");
  }

  // -------------------------------------------------------------
  // SLIDE 11 (NUEVA): Verificar con Criterio: Calidad más allá del Verde
  // -------------------------------------------------------------
  var slide11 = pres.insertSlide(10);
  slide11.getBackground().setSolidFill("#0F172A");
  
  var shapeTitulo11 = slide11.insertShape(SlidesApp.ShapeType.TEXT_BOX, 100, 50, 1080, 100);
  var txtTitulo11 = shapeTitulo11.getText();
  txtTitulo11.setText("Verificar con Criterio: Calidad más allá del \"Verde\"\nCómo auditar críticamente los tests generados por IA");
  txtTitulo11.getParagraphs()[0].getTextStyle().setFontFamily("Urbanist").setFontSize(36).setBold(true).setForegroundColor("#FFFFFF");
  txtTitulo11.getParagraphs()[1].getTextStyle().setFontFamily("Urbanist").setFontSize(18).setForegroundColor("#94A3B8");

  var shapeBody11 = slide11.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 100, 180, 1080, 460);
  shapeBody11.getFill().setSolidFill("#1E293B");
  shapeBody11.getBorder().setSolidFill("#334155");
  var txtB11 = shapeBody11.getText();
  txtB11.setText("¿Un test en verde garantiza calidad?\n\n" +
                 "❌ El Peligro del Falso Verde:\n" +
                 "Tests generados por LLMs que pasan porque no asertan estados relevantes o contienen esperas que enmascaran errores.\n\n" +
                 "🔬 Técnica de Test Mutation en Directo:\n" +
                 "1. Modificamos intencionalmente una línea del componente fuente (ej. comentamos input.current?.focus() en CandidateSearch.tsx).\n" +
                 "2. Ejecutamos el test generado por la IA.\n" +
                 "3. Si el test pasa en verde: EL TEST NO TIENE VALOR DE REGRESIÓN.\n" +
                 "4. Si el test falla exactamente en expect(searchbox).toBeFocused(): EL TEST ES VÁLIDO Y ROBUSTO.\n\n" +
                 "📊 Trace Viewer & Post-Mortem:\n" +
                 "Auditoría visual de eventos de acción, red, DOM snapshots y timeline para garantizar determinismo.");
  txtB11.getTextStyle().setFontFamily("Urbanist").setFontSize(16).setForegroundColor("#E2E8F0");
  txtB11.getParagraphs()[0].getTextStyle().setFontSize(20).setBold(true).setForegroundColor("#FACC15");

  Logger.log("¡Presentación actualizada exitosamente!");
}

function actualizarTextoEnSlide(slide, textoBuscar, textoReemplazar) {
  var shapes = slide.getShapes();
  for (var i = 0; i < shapes.length; i++) {
    var textRange = shapes[i].getText();
    if (textRange && textRange.asString().indexOf(textoBuscar) !== -1) {
      textRange.replaceAllText(textoBuscar, textoReemplazar);
    }
  }
}
