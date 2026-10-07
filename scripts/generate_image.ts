// Nano Banana 2.1 image generator (Google Gemini API)
// Setup: cd scripts && npm install
// Run:   npx ts-node generate_image.ts [options] "your prompt"

import {
  GoogleGenAI,
  ThinkingLevel,
  createUserContent,
  createPartFromUri,
} from '@google/genai';
import mime from 'mime';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load GEMINI_API_KEY from scripts/.env (works from any working directory).
// A GEMINI_API_KEY already set in the shell environment is used as-is.
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

// One constant to change when Google ships the next model.
const MODEL = 'gemini-nano-banana-2.1';

const VALID_RATIOS = ['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const VALID_SIZES = ['1K', '2K', '4K'];
const THINKING: Record<string, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};
const MAX_REFERENCES = 10; // object references supported by Nano Banana 2.1

const DEFAULTS = { aspect: '16:9', size: '2K', thinking: 'medium' };

interface Options {
  prompt: string;
  aspect: string;
  size: string;
  thinking: string;
  assets: string[];
  search: boolean;
  batchFile: string | null;
  batchGet: string | null;
  batchWait: number;
  saveToGallery: string | null;
  outputDir: string;
}

function parseArgs(args: string[]): Options {
  const opts: Options = {
    prompt: '',
    aspect: DEFAULTS.aspect,
    size: DEFAULTS.size,
    thinking: DEFAULTS.thinking,
    assets: [],
    search: false,
    batchFile: null,
    batchGet: null,
    batchWait: 120,
    saveToGallery: null,
    outputDir: '.',
  };
  const promptParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1];
    if ((a === '--aspect' || a === '-a') && next) { opts.aspect = next; i++; }
    else if ((a === '--size' || a === '-s') && next) { opts.size = next.toUpperCase(); i++; }
    else if ((a === '--thinking' || a === '-t') && next) { opts.thinking = next.toLowerCase(); i++; }
    else if (a === '--assets' && next) { opts.assets = next.split(',').map(x => x.trim()).filter(Boolean); i++; }
    else if (a === '--search') { opts.search = true; }
    else if (a === '--batch-file' && next) { opts.batchFile = next; i++; }
    else if (a === '--batch-get' && next) { opts.batchGet = next; i++; }
    else if (a === '--batch-wait' && next) { opts.batchWait = Number(next) || 120; i++; }
    else if (a === '--save-to-gallery' && next) { opts.saveToGallery = next; i++; }
    else if ((a === '--output' || a === '-o') && next) { opts.outputDir = next; i++; }
    else promptParts.push(a);
  }
  opts.prompt = promptParts.join(' ');
  return opts;
}

function usage(): never {
  console.error('Usage: npx ts-node generate_image.ts [options] "your prompt"');
  console.error('');
  console.error('Options:');
  console.error(`  --aspect, -a      ${VALID_RATIOS.join(', ')} (default ${DEFAULTS.aspect})`);
  console.error(`  --size, -s        ${VALID_SIZES.join(', ')} (default ${DEFAULTS.size})`);
  console.error('  --thinking, -t    minimal, medium, high (default medium)');
  console.error(`  --assets          Comma-separated reference image paths (max ${MAX_REFERENCES})`);
  console.error('  --search          Ground the image in Google Search (current facts, real data)');
  console.error('  --batch-file F    Batch mode (half price, async): one prompt per line in file F');
  console.error('  --batch-get NAME  Fetch results of a previous batch job');
  console.error('  --batch-wait SEC  Seconds to wait for a batch before exiting (default 120)');
  console.error('  --save-to-gallery Save result under a name for later reference');
  console.error('  --output, -o      Output directory (default: current directory)');
  process.exit(1);
}

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function buildConfig(opts: Options) {
  return {
    responseModalities: ['IMAGE', 'TEXT'],
    imageConfig: { aspectRatio: opts.aspect, imageSize: opts.size },
    thinkingConfig: { thinkingLevel: THINKING[opts.thinking] },
    ...(opts.search ? { tools: [{ googleSearch: {} }] } : {}),
  };
}

function saveParts(parts: any[] | undefined, outputDir: string, prefix: string, startIndex = 0): string[] {
  const saved: string[] = [];
  let index = startIndex;
  for (const part of parts || []) {
    if (part.inlineData?.data && !part.thought) {
      const ext = mime.getExtension(part.inlineData.mimeType || '') || 'png';
      const fileName = path.join(outputDir, `${prefix}${index++}.${ext}`);
      fs.writeFileSync(fileName, Buffer.from(part.inlineData.data, 'base64'));
      console.log(`Saved: ${fileName}`);
      saved.push(fileName);
    }
  }
  return saved;
}

async function collectBatch(ai: GoogleGenAI, name: string, outputDir: string): Promise<boolean> {
  const job: any = await ai.batches.get({ name });
  const state = String(job.state);
  console.log(`Batch ${name}: ${state}`);
  if (state.includes('FAILED') || state.includes('CANCELLED') || state.includes('EXPIRED')) fail(`Batch ended with state ${state}`);
  if (!state.includes('SUCCEEDED')) return false;
  const responses = job.dest?.inlinedResponses || [];
  responses.forEach((r: any, i: number) => {
    if (r.error) { console.error(`Prompt ${i + 1} failed:`, r.error.message || r.error); return; }
    const saved = saveParts(r.response?.candidates?.[0]?.content?.parts, outputDir, `batch_${i + 1}_`);
    if (!saved.length) console.error(`Prompt ${i + 1}: no image returned`);
  });
  return true;
}

async function runBatch(ai: GoogleGenAI, opts: Options) {
  const prompts = fs.readFileSync(opts.batchFile!, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  if (!prompts.length) fail('Batch file has no prompts');
  console.log(`Submitting batch of ${prompts.length} prompt(s) at ${opts.size} ${opts.aspect} (half price, may take minutes to hours)`);
  const job: any = await ai.batches.create({
    model: MODEL,
    src: { inlinedRequests: prompts.map(p => ({ contents: [{ role: 'user', parts: [{ text: p }] }], config: buildConfig(opts) as any })) } as any,
    config: { displayName: 'nano-banana-2.1-batch' },
  });
  console.log(`Batch job: ${job.name}`);
  console.log(`Fetch later with: npx ts-node generate_image.ts --batch-get ${job.name} -o ${opts.outputDir}`);
  const deadline = Date.now() + opts.batchWait * 1000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 15000));
    if (await collectBatch(ai, job.name, opts.outputDir)) return;
  }
  console.log('Not finished yet; use the --batch-get command above to collect results.');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.prompt && !opts.batchFile && !opts.batchGet) usage();

  if (!VALID_RATIOS.includes(opts.aspect)) fail(`Invalid aspect ratio "${opts.aspect}". Valid: ${VALID_RATIOS.join(', ')}`);
  if (!VALID_SIZES.includes(opts.size)) fail(`Invalid size "${opts.size}". Valid: ${VALID_SIZES.join(', ')}`);
  if (!THINKING[opts.thinking]) fail(`Invalid thinking level "${opts.thinking}". Valid: minimal, medium, high`);
  if (opts.assets.length > MAX_REFERENCES) fail(`Too many reference images (${opts.assets.length}). Maximum: ${MAX_REFERENCES}`);
  for (const p of opts.assets) {
    if (!fs.existsSync(p)) fail(`Reference image not found: ${p}`);
  }
  if (!process.env.GEMINI_API_KEY) {
    fail('GEMINI_API_KEY not found. Create scripts/.env with GEMINI_API_KEY=your_key (see SETUP.md)');
  }

  fs.mkdirSync(opts.outputDir, { recursive: true });

  console.log(`Model: ${MODEL} | ${opts.aspect} | ${opts.size} | thinking: ${opts.thinking}${opts.search ? ' | search grounding' : ''}`);
  if (opts.assets.length) console.log(`References: ${opts.assets.join(', ')}`);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  if (opts.batchGet) { await collectBatch(ai, opts.batchGet, opts.outputDir); return; }
  if (opts.batchFile) { await runBatch(ai, opts); return; }

  // Upload reference images
  const uploaded: Array<{ name: string; uri: string; mimeType: string }> = [];
  for (const assetPath of opts.assets) {
    try {
      console.log(`Uploading reference: ${assetPath}`);
      const file = await ai.files.upload({
        file: assetPath,
        config: { mimeType: mime.getType(assetPath) || 'image/jpeg' },
      });
      uploaded.push({ name: file.name!, uri: file.uri!, mimeType: file.mimeType || 'image/jpeg' });
    } catch (error) {
      console.error(`Warning: could not upload ${assetPath}:`, error);
    }
  }

  const contentParts: Array<any> = uploaded.map(a => createPartFromUri(a.uri, a.mimeType));
  if (uploaded.length > 0) {
    contentParts.push('Use the provided reference image(s) as specified in the prompt.');
  }
  contentParts.push(opts.prompt);

  const savedFiles: string[] = [];
  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: createUserContent(contentParts),
      config: buildConfig(opts),
    });

    let index = 0;
    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          // Skip interim "thought" images; save only the final output
          if (part.thought) continue;
          const ext = mime.getExtension(part.inlineData.mimeType || '') || 'png';
          const fileName = path.join(opts.outputDir, `image_${index++}.${ext}`);
          fs.writeFileSync(fileName, Buffer.from(part.inlineData.data, 'base64'));
          console.log(`Saved: ${fileName}`);
          savedFiles.push(fileName);
        } else if (part.text && !part.thought) {
          console.log(part.text);
        }
      }
    }
  } finally {
    // Always remove uploaded references from Google's servers
    for (const a of uploaded) {
      try { await ai.files.delete({ name: a.name }); }
      catch (error) { console.error(`Warning: could not delete ${a.name}:`, error); }
    }
  }

  if (savedFiles.length === 0) {
    fail('No image was returned (the prompt may have been blocked by safety filters).');
  }

  if (opts.saveToGallery) {
    const galleryDir = path.join(__dirname, '..', 'assets', 'gallery');
    fs.mkdirSync(galleryDir, { recursive: true });
    const ext = path.extname(savedFiles[0]);
    const galleryImage = path.join(galleryDir, `${opts.saveToGallery}${ext}`);
    fs.copyFileSync(savedFiles[0], galleryImage);
    fs.writeFileSync(
      path.join(galleryDir, `${opts.saveToGallery}.meta.json`),
      JSON.stringify({ prompt: opts.prompt, aspect: opts.aspect, size: opts.size, thinking: opts.thinking, model: MODEL, createdAt: new Date().toISOString() }, null, 2),
    );
    console.log(`Saved to gallery: ${galleryImage}`);
  }
}

main().catch(err => {
  console.error('Generation failed:', err?.message || err);
  process.exit(1);
});
