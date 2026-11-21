import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
const MALE_INDIAN_NEURAL_VOICES: Record<string, string> = {
  'ta-IN': 'ta-IN-ValluvarNeural',
  'ta':    'ta-IN-ValluvarNeural',
  'te-IN': 'te-IN-MohanNeural',
  'te':    'te-IN-MohanNeural',
  'ml-IN': 'ml-IN-MidhunNeural',
  'ml':    'ml-IN-MidhunNeural',
  'hi-IN': 'hi-IN-MadhurNeural',
  'hi':    'hi-IN-MadhurNeural',
  'kn-IN': 'kn-IN-GaganNeural',
  'kn':    'kn-IN-GaganNeural',
  'en-IN': 'en-IN-PrabhatNeural',
  'en':    'en-IN-PrabhatNeural',
};
const ttsAudioCache = new Map<string, Buffer>();
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'indian-male-tts-middleware',
      configureServer(server) {
        server.middlewares.use('/api/tts', async (req, res) => {
          try {
            let text = '';
            let bcp47 = 'en-IN';
            if (req.method === 'GET' && req.url) {
              const u = new URL(req.url, 'http://localhost');
              text = u.searchParams.get('text') || '';
              bcp47 = u.searchParams.get('bcp47') || 'en-IN';
            } else {
              let body = '';
              await new Promise<void>((r) => {
                req.on('data', (c) => (body += c));
                req.on('end', () => r());
              });
              const parsed = JSON.parse(body || '{}');
              text = parsed.text || '';
              bcp47 = parsed.bcp47 || 'en-IN';
            }
            const key = bcp47.trim();
            const voiceName = MALE_INDIAN_NEURAL_VOICES[key] || MALE_INDIAN_NEURAL_VOICES[key.split('-')] || 'en-IN-PrabhatNeural';
            const cacheKey = voiceName + '::' + text;
            if (ttsAudioCache.has(cacheKey)) {
              const cached = ttsAudioCache.get(cacheKey)!;
              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Content-Length', cached.length);
              return res.end(cached);
            }
            const tts = new MsEdgeTTS();
            await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Transfer-Encoding', 'chunked');
            const { audioStream } = tts.toStream(text, { pitch: '-3%', rate: '+15%' });
            const chunks: Buffer[] = [];
            const killer = setTimeout(() => {
              try { tts.close(); } catch {}
              if (!res.writableEnded) res.end();
            }, 4000);
            audioStream.on('data', (c: Buffer) => {
              chunks.push(c);
              if (!res.writableEnded) res.write(c);
            });
            audioStream.on('end', () => {
              clearTimeout(killer);
              try { tts.close(); } catch {}
              const full = Buffer.concat(chunks);
              if (full.length > 300) ttsAudioCache.set(cacheKey, full);
              if (!res.writableEnded) res.end();
            });
            audioStream.on('error', () => {
              clearTimeout(killer);
              try { tts.close(); } catch {}
              if (!res.writableEnded) res.end();
            });
          } catch (err) {
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end(String(err));
            }
          }
        });
      },
    },
  ],
});
