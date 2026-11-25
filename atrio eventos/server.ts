import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import {
  createVenue,
  deleteVenue,
  isSupabaseConfigured,
  listVenues,
  updateVenue,
  validateVenueInput,
} from './server/db.ts';
import { askVenueAssistant, isGeminiConfigured } from './server/gemini.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.get('/api/health', async (_req, res) => {
  try {
    const { source, records } = await listVenues();
    res.json({
      ok: true,
      storageMode: source,
      supabaseConfigured: isSupabaseConfigured(),
      geminiConfigured: isGeminiConfigured(),
      totalRecords: records.length,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Error de estado del servidor',
    });
  }
});

app.get('/api/venues', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const category =
      req.query.category === 'salon' || req.query.category === 'proveedor'
        ? req.query.category
        : 'all';
    const minCapacity = req.query.minCapacity ? Number(req.query.minCapacity) : undefined;
    const service = typeof req.query.service === 'string' ? req.query.service : undefined;
    const availableOnly = req.query.availableOnly === 'true';

    const result = await listVenues({
      q,
      category,
      minCapacity,
      service,
      availableOnly,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Error al obtener el catálogo',
    });
  }
});

app.post('/api/venues', async (req, res) => {
  try {
    const validation = validateVenueInput(req.body ?? {});
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const created = await createVenue(validation.data);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Error al crear el registro',
    });
  }
});

app.put('/api/venues/:id', async (req, res) => {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const validation = validateVenueInput(req.body ?? {});
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const updated = await updateVenue(id, validation.data);
    if (!updated.record) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Error al actualizar el registro',
    });
  }
});

app.delete('/api/venues/:id', async (req, res) => {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const result = await deleteVenue(id);
    if (!result.deleted) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Error al eliminar el registro',
    });
  }
});

app.get('/api/venues/export/kml', async (_req, res) => {
  try {
    const { records } = await listVenues();
    const placemarks = records
      .map(
        (v) => `
    <Placemark>
      <name>${escapeXml(v.name)}</name>
      <description>${escapeXml(
        `${v.category === 'salon' ? 'Salón' : 'Proveedor'} | Capacidad: ${v.capacity} invitados | $${v.price.toLocaleString('es-MX')} MXN (${v.price_unit}) | Servicios: ${v.services.join(', ')} | Tel: ${v.contact_phone} | ${v.address}`
      )}</description>
      <Point>
        <coordinates>${v.longitude},${v.latitude},0</coordinates>
      </Point>
    </Placemark>`
      )
      .join('\n');

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Atrio Eventos — Salones y Proveedores</name>
    <description>Ubicaciones exportadas para Google My Maps y Google Earth</description>${placemarks}
  </Document>
</kml>`;

    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="atrio-eventos-ubicaciones.kml"');
    res.send(kml);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'No se pudo exportar el archivo KML',
    });
  }
});

app.post('/api/assistant/chat', async (req, res) => {
  try {
    const message = String(req.body?.message ?? '').trim();
    if (!message || message.length > 1500) {
      res.status(400).json({ error: 'Escribe una consulta válida (máx. 1500 caracteres).' });
      return;
    }

    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = rawHistory
      .filter(
        (item: unknown): item is { role: 'user' | 'model'; text: string } =>
          Boolean(
            item &&
              typeof item === 'object' &&
              ((item as { role?: string }).role === 'user' || (item as { role?: string }).role === 'model') &&
              typeof (item as { text?: string }).text === 'string'
          )
      )
      .slice(-6);

    const { records } = await listVenues();
    const answer = await askVenueAssistant(message, records, history);
    res.json(answer);
  } catch (err) {
    let msg = err instanceof Error ? err.message : 'Error en el asistente Gemini';
    try {
      const parsed = JSON.parse(msg) as { error?: { message?: string; code?: number } };
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
    } catch {
      // Keep original message if not JSON
    }
    const status = msg.includes('GEMINI_API_KEY') ? 503 : msg.includes('high demand') || msg.includes('UNAVAILABLE') ? 503 : 500;
    res.status(status).json({ error: msg });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Atrio Eventos server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
