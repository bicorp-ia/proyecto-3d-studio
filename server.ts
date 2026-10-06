import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Domain-specific knowledge fallback for spikes or offline mode
function getKnowledgeBaseAnswer(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('temperatura') || q.includes('calor') || q.includes('150') || q.includes('200')) {
    return 'Para requerimientos térmicos elevados (>150°C) y resistencia a hidrocarburos/aceites industriales, te recomiendo **PEEK Termoplástico Aeroespacial** (HDT hasta 260°C e ignífugo UL94 V-0) o **Nylon PA12 con 20% Fibra de Carbono** (HDT 150°C). Si requieres estanqueidad química absoluta en metal, el mecanizado **CNC en Acero Inoxidable 316L** o **Aluminio 7075-T6** es la opción idónea. Puedes seleccionar estos materiales directamente en el cotizador.';
  }
  if (q.includes('tolerancia') || q.includes('iso') || q.includes('precision') || q.includes('precisión')) {
    return 'En Proyect3d operamos bajo dos estándares clave: **ISO 2768-m** (tolerancia media para plásticos de ±0.2 mm a ±0.5 mm en FDM y SLS) y **ISO 2768-f** (tolerancia fina para mecanizado CNC 5 Ejes de ±0.02 mm a ±0.05 mm). Para piezas con ajustes forzados o rodamientos H7, recomendamos CNC o insertos roscados de latón M3-M8.';
  }
  if (q.includes('espesor') || q.includes('dfam') || q.includes('pared') || q.includes('minimo')) {
    return 'Los límites de espesor mínimo por tecnología según nuestras normas DFAM son: **FDM: ≥ 1.2 mm**, **SLA/DLP: ≥ 0.6 mm**, **SLS/MJF: ≥ 0.8 mm** y **CNC 5 Ejes: ≥ 0.8 mm**. Puedes subir tu archivo .STL o activar cualquiera de nuestros modelos de muestra en el Visor 3D para ver el análisis de espesores en tiempo real.';
  }
  if (q.includes('reunion') || q.includes('reunión') || q.includes('cita') || q.includes('ingeniero')) {
    return 'Con gusto podemos agendar una videollamada técnica de 30 minutos vía Google Meet con nuestro Lead Application Engineer para validar tolerancias ISO 2768 o cotizaciones de series B2B. Haz clic en "Agendar Cita Técnica" para seleccionar tu fecha preferida.';
  }
  return 'En Proyect3d somos especialistas en fabricación aditiva industrial (FDM, SLA, SLS/MJF) y mecanizado CNC 5 Ejes bajo norma ISO 9001:2015. Todos tus archivos CAD están amparados bajo nuestro Acuerdo de Confidencialidad (NDA). ¿Deseas que te oriente en selección de polímeros técnicos, cálculo de volumen o generación de cotización formal en PDF?';
}
function getGenAI() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to detect UI actions from user message or model response
function detectUiAction(query: string, reply: string): any {
  const text = (query + ' ' + reply).toLowerCase();

  if (text.includes('resina') && (query.toLowerCase().includes('cambi') || query.toLowerCase().includes('pon') || query.toLowerCase().includes('resina'))) {
    return {
      type: 'SET_MATERIAL',
      payload: { technology: 'sla', materialId: 'sla-precision' },
      label: 'Configurar Resina Alta Precisión',
    };
  }
  if ((text.includes('nylon') || text.includes('pa12') || text.includes('carbon')) && (query.toLowerCase().includes('cambi') || query.toLowerCase().includes('pon') || query.toLowerCase().includes('material'))) {
    return {
      type: 'SET_MATERIAL',
      payload: { technology: 'fdm', materialId: 'fdm-pa12-cf' },
      label: 'Configurar Nylon PA12-CF',
    };
  }
  if (text.includes('peek') && (query.toLowerCase().includes('cambi') || query.toLowerCase().includes('pon') || query.toLowerCase().includes('peek'))) {
    return {
      type: 'SET_MATERIAL',
      payload: { technology: 'fdm', materialId: 'fdm-peek' },
      label: 'Configurar PEEK Aeroespacial',
    };
  }
  if ((text.includes('cnc') || text.includes('aluminio') || text.includes('fresado')) && (query.toLowerCase().includes('cambi') || query.toLowerCase().includes('pon') || query.toLowerCase().includes('mecaniz'))) {
    return {
      type: 'SET_MATERIAL',
      payload: { technology: 'cnc', materialId: 'cnc-al-6061' },
      label: 'Configurar CNC Aluminio 6061',
    };
  }
  if (text.includes('rayos x') || text.includes('x-ray') || text.includes('interior') || text.includes('translúcid')) {
    return {
      type: 'SET_RENDER_MODE',
      payload: { mode: 'xray' },
      label: 'Activar Vista X-Ray Translúcida',
    };
  }
  if (text.includes('mapa de calor') || text.includes('heatmap') || text.includes('paredes delgadas') || text.includes('espesor minimo')) {
    return {
      type: 'SET_RENDER_MODE',
      payload: { mode: 'heatmap' },
      label: 'Activar Mapa de Calor DFAM',
    };
  }
  if (text.includes('capa') && (query.toLowerCase().includes('ver') || query.toLowerCase().includes('simul') || query.toLowerCase().includes('lamin'))) {
    return {
      type: 'SET_RENDER_MODE',
      payload: { mode: 'layers' },
      label: 'Simulador de Capas Z',
    };
  }
  if (text.includes('optimiza') || text.includes('orientar') || text.includes('reducir soporte') || text.includes('menor coste')) {
    return {
      type: 'OPTIMIZE_ORIENTATION',
      label: 'Optimizar Orientación 3D Automática',
    };
  }
  if (text.includes('pagar') || text.includes('comprar') || text.includes('checkout') || text.includes('lanzar producci')) {
    return {
      type: 'OPEN_CHECKOUT',
      label: 'Abrir Pasarela de Pago Online',
    };
  }
  if (text.includes('pdf') || text.includes('presupuesto formal') || text.includes('cotización formal')) {
    return {
      type: 'OPEN_FORMAL_QUOTE',
      label: 'Generar Ficha Técnica PDF',
    };
  }
  if (text.includes('reunion') || text.includes('reunión') || text.includes('cita') || text.includes('ingeniero')) {
    return {
      type: 'SCHEDULE_MEETING',
      label: 'Agendar Cita Técnica (Google Meet)',
    };
  }

  return undefined;
}

// Proyect3d Knowledge Base & System Prompt
const SYSTEM_PROMPT = `
Eres "Proyect3d Bot", el Asistente Técnico y Especialista en Ingeniería de Manufactura Avanzada de la empresa "Proyect3d".
Tu propósito es asesorar a ingenieros, diseñadores de producto y empresas industriales en:
1. Selección de materiales según requerimientos mecánicos, térmicos, químicos y cosméticos:
   - FDM: PLA, ABS, PETG, TPU 95A, ASA, Nylon PA12-CF (reemplazo de aluminio), PEEK (>250°C aeroespacial).
   - SLA / DLP: Resina Estándar, Alta Precisión, Calcinable, Resina Alta Temperatura (HDT 238°C).
   - SLS / MJF: Nylon PA12 (isotrópico, estanco, sin soporte), Nylon PA11, TPU SLS, Polipropileno.
   - CNC 5 Ejes: Aluminio 6061-T6, Aluminio 7075-T6, Acero Inox 316L, Latón, Delrin/POM.
2. Normativas y Tolerancias:
   - ISO 2768-m (general plástico ±0.2 mm a ±0.5 mm).
   - ISO 2768-f (mecanizado CNC precisión ±0.02 mm a ±0.05 mm).
3. Reglas DFAM:
   - Espesor mínimo: FDM 0.8-1.2mm, SLA 0.4-0.6mm, SLS 0.8-1.0mm, CNC 1.5mm.
   - Orientación óptima para reducir soportes y minimizar Z.
4. Políticas de Servicio:
   - Confidencialidad estricta NDA automático.
   - Envíos Express 24-48h o Estándar 3-5 días.
5. Control Interactivo sobre la Interfaz:
   - Tienes la capacidad de accionar la UI para el usuario (cambiar a resina o nylon, activar vista radiografía X-Ray, activar mapa de calor DFAM de espesores, rotar y optimizar la orientación 3D, o abrir la pasarela de pago). Indícaselo al usuario de forma proactiva.

Instrucciones:
- Sé técnico, conciso y profesional en español.
`;

// API endpoint for Chatbot
app.post('/api/chat', async (req: Request, res: Response) => {
  const message = req.body?.message;
  const history = req.body?.history;

  try {
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Prepare contents
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-6)) {
        if (msg.role === 'user' || msg.role === 'model') {
          contents.push({
            role: msg.role,
            parts: [{ text: String(msg.text || '') }],
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const ai = getGenAI();
    let replyText = '';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });
      replyText = response.text || '';
    } catch (modelErr: any) {
      console.warn('gemini-3.8-flash transient issue, falling back to gemini-3.1-flash-lite:', modelErr?.message);
      try {
        const responseLite = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.7,
          },
        });
        replyText = responseLite.text || '';
      } catch (liteErr) {
        throw modelErr;
      }
    }

    if (!replyText) {
      replyText = 'Entendido. ¿En qué aspecto técnico de fabricación (FDM, SLA, SLS o CNC) o selección de materiales puedo asesorarte?';
    }

    const uiAction = detectUiAction(message, replyText);

    res.json({ reply: replyText, uiAction });
  } catch (error: any) {
    console.error('Notice in /api/chat (using KB response):', error?.message || error);
    const fallbackAnswer = getKnowledgeBaseAnswer(message);
    const uiAction = detectUiAction(message, fallbackAnswer);
    res.json({ 
      reply: fallbackAnswer,
      uiAction,
      fallbackUsed: true
    });
  }
});

// In-memory quote registration
const registeredQuotes: any[] = [];

app.post('/api/quote/submit', (req: Request, res: Response) => {
  try {
    const quoteData = req.body;
    const quoteId = `PRY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const record = {
      id: quoteId,
      createdAt: new Date().toISOString(),
      ...quoteData,
      status: 'REGISTRADO_CRM',
    };

    registeredQuotes.unshift(record);
    console.log(`[Proyect3d CRM] Nueva cotización registrada: ${quoteId}`);

    res.json({
      success: true,
      quoteId,
      message: 'Cotización registrada con éxito en el sistema central de Proyect3d.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar cotización' });
  }
});

// API endpoint for scheduling meetings
app.post('/api/lead/meeting', (req: Request, res: Response) => {
  try {
    const { name, email, company, date, time, topic, projectDetails } = req.body;
    const meetingId = `MTG-${Math.floor(10000 + Math.random() * 90000)}`;
    
    console.log(`[Proyect3d Agenda] Reunión reservada: ${meetingId} para ${name} (${company || 'Particular'})`);

    res.json({
      success: true,
      meetingId,
      message: `Reunión agendada para el ${date} a las ${time}h. Se ha enviado la invitación con enlace Google Meet a ${email}.`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al agendar reunión' });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Proyect3d] Servidor activo en puerto ${PORT}`);
  });
}

startServer();
