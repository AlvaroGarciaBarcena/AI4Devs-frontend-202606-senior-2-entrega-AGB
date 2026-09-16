/**
 * Google Apps Script para actualizar automáticamente la presentación en Google Slides:
 * "TESTING 2: AUTOMATED TESTS Y QA: E2E Testing e IA Agéntica"
 * 
 * INSTRUCCIONES DE USO EN GOOGLE SLIDES (1 minuto):
 * 1. Abre tu presentación: https://docs.google.com/presentation/d/1IiT9moRBj6Ido7ClOtOibWKaO9E3sdYvQ4-srmrN_J8/edit
 * 2. En el menú superior, haz clic en: Extensiones -> Apps Script.
 * 3. Borra todo el código y pega este archivo completo.
 * 4. Haz clic en "Guardar" (icono 💾) y luego en "Ejecutar" (Run ▶️).
 * 5. ¡Listo! Se ejecutará limpiamente sin errores de tipo de forma.
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
    
    var txt4Content = "EL FRAMEWORK DE 5 FASES PARA E2E CON IA\n" +
      "1. Preparar el Repo: Semántica y Accesibilidad (AOM) como API nativa para la IA.\n" +
      "2. Dar Contexto: Especificación funcional clara (criterios BS-01 a BS-04) y estado determinista.\n" +
      "3. Fijar el Harness: Servidor Playwright MCP, prohibición de selectores CSS frágiles y mocks.\n" +
      "4. Generar con el Agente: Enfoque Semántico (AOM / Playwright) vs Visión Multimodal (Midscene).\n" +
      "5. Verificar con Criterio: Calidad más allá del verde mediante Test Mutation en vivo.";
      
    var box4 = slide4.insertTextBox(txt4Content, 120, 460, 1040, 200);
    box4.getFill().setSolidFill("#0F172A");
    box4.getText().getTextStyle().setFontFamily("Urbanist").setFontSize(13).setForegroundColor("#F8FAFC");
    box4.getText().getParagraphs()[0].getRange().getTextStyle().setFontSize(14).setBold(true).setForegroundColor("#FACC15");
  }

  // -------------------------------------------------------------
  // SLIDE 6: AOM vs DOM (Conexión con Playwright MCP)
  // -------------------------------------------------------------
  if (slides.length >= 6) {
    var slide6 = slides[5];
    var txt6Content = "💡 ¿Cómo consume el Agente el AOM?\n" +
      "A través del Playwright MCP Server (@playwright/mcp), el agente recibe el árbol de accesibilidad en formato semántico ligero vía stdio, operando con getByRole('searchbox') y getByRole('button') sin selectores CSS frágiles ni visión costosa.";
      
    var box6 = slide6.insertTextBox(txt6Content, 120, 580, 1040, 100);
    box6.getFill().setSolidFill("#1E3A8A");
    box6.getText().getTextStyle().setFontFamily("Urbanist").setFontSize(12).setForegroundColor("#FFFFFF");
    box6.getText().getParagraphs()[0].getRange().getTextStyle().setFontSize(13).setBold(true).setForegroundColor("#FACC15");
  }

  // -------------------------------------------------------------
  // SLIDE 8: PARTE 1 - Configuración 1: Playwright + MCP Agéntico
  // -------------------------------------------------------------
  if (slides.length >= 8) {
    var slide8 = slides[7];
    actualizarTextoEnSlide(slide8, "1. Cypress: Rapidez y DX", "PARTE 1: Configuración 1: Playwright + MCP Agéntico");
    actualizarTextoEnSlide(slide8, "Cypress", "Playwright MCP");
    
    var txt8Content = "Configuración 1: Playwright + MCP Agéntico (AOM / Antigravity)\n\n" +
      "• Protocolo MCP (@playwright/mcp): Conexión bidireccional nativa por stdio que dota al LLM de herramientas de navegador.\n" +
      "• Interacción Semántica por Roles AOM: El agente opera con getByRole('searchbox'), getByRole('button') y regiones aria-live.\n" +
      "• Generación en Vivo: Antigravity inspecciona la aplicación abierta, prueba interacciones y sintetiza el test en TypeScript nativo.\n" +
      "• Determinismo en CI: Pruebas nativas que se ejecutan a velocidad de máquina en CI/CD con coste $0 de tokens en runtime.\n\n" +
      "Caso Práctico en Vivo: Exploración y generación del test E2E del buscador de candidatos (CandidateSearch.tsx).";
      
    var box8 = slide8.insertTextBox(txt8Content, 120, 200, 1040, 440);
    box8.getFill().setSolidFill("#0F172A");
    box8.getText().getTextStyle().setFontFamily("Urbanist").setFontSize(15).setForegroundColor("#E2E8F0");
    box8.getText().getParagraphs()[0].getRange().getTextStyle().setFontSize(22).setBold(true).setForegroundColor("#38BDF8");
  }

  // -------------------------------------------------------------
  // SLIDE 9: PARTE 2 - Industrialización con npx playwright init-agents
  // -------------------------------------------------------------
  if (slides.length >= 9) {
    var slide9 = slides[8];
    actualizarTextoEnSlide(slide9, "2. Playwright: Potencia Industrial", "PARTE 2: Industrialización con npx playwright init-agents");
    
    var txt9Content = "Industrialización Agéntica: npx playwright init-agents\n" +
      "Comando oficial: npx playwright init-agents --loop=<vscode|claude|codex>\n\n" +
      "La Tríada Oficial de Agentes Autónomos de Playwright:\n" +
      "• 🗺️ Planner Agent: Explora autónomamente la UI viva y redacta un plan de pruebas en Markdown (test-plan.md).\n" +
      "• ⚙️ Generator Agent: Transforma el plan Markdown en código .spec.ts validando locators y aserciones en vivo.\n" +
      "• 🩹 Healer Agent (Self-Healing): Diagnostica tests fallidos y auto-repara selectores ante cambios en el frontend.\n\n" +
      "El Arnés seed.spec.ts: El punto de entrada humano que proporciona estado limpio, mocks y estabilidad a los agentes.";
      
    var box9 = slide9.insertTextBox(txt9Content, 120, 200, 1040, 440);
    box9.getFill().setSolidFill("#0F172A");
    box9.getText().getTextStyle().setFontFamily("Urbanist").setFontSize(15).setForegroundColor("#E2E8F0");
    box9.getText().getParagraphs()[0].getRange().getTextStyle().setFontSize(22).setBold(true).setForegroundColor("#FACC15");
    box9.getText().getParagraphs()[1].getRange().getTextStyle().setFontSize(13).setForegroundColor("#94A3B8");
  }

  // -------------------------------------------------------------
  // SLIDE 10: Configuración 2: Testing Multimodal con Visión (Midscene)
  // -------------------------------------------------------------
  if (slides.length >= 10) {
    var slide10 = slides[9];
    actualizarTextoEnSlide(slide10, "3. Midscene: Visión Multimodal", "Configuración 2: Testing Multimodal con Visión (Midscene)");
    
    var txt10Content = "Testing Basado en Visión: Midscene (Set-of-Mark & GPT-4o)\n\n" +
      "• Zero Selectors: La IA inspecciona la pantalla mediante capturas visuales procesadas con etiquetas numéricas (SoM).\n" +
      "• Lenguaje Natural: .ai('buscar candidato \"José\"') y .aiAssert('ver 1 de 3 candidatos').\n\n" +
      "AOM/MCP vs Visión Multimodal (Criterio para Seniors):\n" +
      "• Playwright MCP & Agents: Máxima velocidad, coste $0 en CI, 100% determinista. Ideal para SPAs y diseño atómico accesible.\n" +
      "• Midscene (Visión): Mayor latencia y coste en tokens. Ideal para Canvas, WebGL, flujos exploratorios o UIs sin semántica.";
      
    var box10 = slide10.insertTextBox(txt10Content, 120, 200, 1040, 440);
    box10.getFill().setSolidFill("#0F172A");
    box10.getText().getTextStyle().setFontFamily("Urbanist").setFontSize(15).setForegroundColor("#E2E8F0");
    box10.getText().getParagraphs()[0].getRange().getTextStyle().setFontSize(22).setBold(true).setForegroundColor("#38BDF8");
  }

  // -------------------------------------------------------------
  // SLIDE 11 (NUEVA): Verificar con Criterio: Calidad más allá del Verde
  // -------------------------------------------------------------
  var slide11 = pres.insertSlide(10);
  slide11.getBackground().setSolidFill("#0F172A");
  
  var boxTitulo11 = slide11.insertTextBox("Verificar con Criterio: Calidad más allá del \"Verde\"\nCómo auditar críticamente los tests generados por IA", 100, 40, 1080, 110);
  boxTitulo11.getText().getParagraphs()[0].getRange().getTextStyle().setFontFamily("Urbanist").setFontSize(34).setBold(true).setForegroundColor("#FFFFFF");
  boxTitulo11.getText().getParagraphs()[1].getRange().getTextStyle().setFontFamily("Urbanist").setFontSize(18).setForegroundColor("#94A3B8");

  var txt11Content = "¿Un test en verde garantiza calidad?\n\n" +
    "❌ El Peligro del Falso Verde:\n" +
    "Tests generados por LLMs que pasan porque no asertan estados relevantes o contienen esperas que enmascaran errores.\n\n" +
    "🔬 Técnica de Test Mutation en Directo:\n" +
    "1. Modificamos intencionalmente una línea del componente fuente (ej. comentamos input.current?.focus() en CandidateSearch.tsx).\n" +
    "2. Ejecutamos el test generado por la IA.\n" +
    "3. Si el test pasa en verde: EL TEST NO TIENE VALOR DE REGRESIÓN.\n" +
    "4. Si el test falla exactamente en expect(searchbox).toBeFocused(): EL TEST ES VÁLIDO Y ROBUSTO.\n\n" +
    "📊 Trace Viewer & Post-Mortem:\n" +
    "Auditoría visual de eventos de acción, red, DOM snapshots y timeline para garantizar determinismo.";

  var boxBody11 = slide11.insertTextBox(txt11Content, 100, 170, 1080, 480);
  boxBody11.getFill().setSolidFill("#1E293B");
  boxBody11.getText().getTextStyle().setFontFamily("Urbanist").setFontSize(15).setForegroundColor("#E2E8F0");
  boxBody11.getText().getParagraphs()[0].getRange().getTextStyle().setFontSize(20).setBold(true).setForegroundColor("#FACC15");

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
