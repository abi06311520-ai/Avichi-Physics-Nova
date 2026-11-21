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
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  try {
    const { text, bcp47 } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const key = (bcp47 || '').trim();
    const voiceName = MALE_INDIAN_NEURAL_VOICES[key] || MALE_INDIAN_NEURAL_VOICES[key.split('-')[0]] || 'en-IN-PrabhatNeural';
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { pitch: '-3%', rate: '+14%' });
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (c: Buffer) => chunks.push(c));
      audioStream.on('end', () => resolve());
      audioStream.on('error', reject);
    });
    const full = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(full);
  } catch (err) {
    res.status(500).end(String(err));
  }
}
