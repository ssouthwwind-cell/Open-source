import tailwindcss from "@tailwindcss/vite";
import express from "express";
import react from "@vitejs/plugin-react";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // API Proxy Route
  app.post("/api/proxy/analyze", async (req, res) => {
    try {
      const { config, payload } = req.body;
      if (!config || !config.baseUrl || !config.model) {
        return res.status(400).json({ error: 'Missing model configuration' });
      }

      const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          ...payload
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('External API Error:', response.status, errorText);
        return res.status(response.status).json({ error: `External API Error: ${response.status}`, details: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Proxy Error:', error);
      res.status(500).json({ error: 'Internal Server Error', details: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: false,
      plugins: [react(), tailwindcss()],
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if needed, but dev is main focus here)
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
