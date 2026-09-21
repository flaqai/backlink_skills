#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createHash, createHmac } from 'node:crypto';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, delimiter, dirname, extname, join, posix } from 'node:path';

const DEFAULT_CONFIG = 'writer/config/r2.config.json';
const BOOLEAN_OPTIONS = new Set(['help', 'noCompress', 'dryRun']);
const VALUE_OPTIONS = new Set([
  'config',
  'key',
  'blogDir',
  'date',
  'seoName',
  'keyword',
  'topic',
  'article',
  'manifest',
  'alt',
  'contentType',
  'compressionQuality',
  'compressionFormat',
  'compressedFile',
  'minCompressionSavingsPercent',
  'quality',
  'file',
]);
const OPTION_ALIASES = new Map([['dry-run', 'dryRun']]);
const args = parseArgs(process.argv.slice(2));

if (args.help || !args.file) {
  printUsage();
  process.exit(args.help ? 0 : 1);
}

const filePath = args.file;
await access(filePath);

const configSource = await loadConfig(args);
if (!configSource) {
  console.log(JSON.stringify({
    ok: true,
    skipped: true,
    reason: 'r2-config-not-found',
    config: DEFAULT_CONFIG,
    file: filePath,
    localReference: `./${basename(filePath)}`,
    articleUpdated: false,
    manifestUpdated: false,
  }, null, 2));
  process.exit(0);
}

const config = configSource.config;
validateConfig(config, configSource.label);

const uploadPreparation = await prepareImageForUpload(filePath, args);
const uploadFilePath = uploadPreparation.uploadFile;
const body = await readFile(uploadFilePath);
const contentType = args.contentType || contentTypeFor(uploadFilePath);
const uploadAlt = args.alt || '';
const uploadKeyword = args.keyword || '';
const uploadTopic = args.topic || '';
const uploadDate = parseUploadDate(args.date || new Date());
const objectKey = normalizeKey(args.key
  ? sanitizeObjectKeyFilename(args.key, uploadFilePath)
  : buildDefaultKey({
    keyPrefix: config.keyPrefix,
    blogDirectory: args.blogDir || config.blogDirectory || 'blog',
    date: uploadDate,
    filePath,
    extensionPath: uploadFilePath,
    seoName: args.seoName || uploadKeyword || uploadTopic || '',
  }));
const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
const uploadUrl = `${endpoint}/${encodePath(config.bucket)}/${encodePath(objectKey)}`;

if (!args.dryRun) {
  await putObject({
    url: uploadUrl,
    region: config.region || 'auto',
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    body,
    contentType,
  });
}

const publicUrl = joinPublicUrl(config.publicBaseUrl, objectKey);

if (args.article && !args.dryRun) {
  await replaceArticleImageUrl(args.article, filePath, publicUrl, args.alt);
}

const result = {
  ok: true,
  file: filePath,
  uploadedFile: uploadFilePath,
  compression: uploadPreparation.compression,
  seoName: args.seoName || null,
  alt: uploadAlt || null,
  keyword: uploadKeyword || null,
  topic: uploadTopic || null,
  bucket: config.bucket,
  key: objectKey,
  blogDirectory: args.blogDir || config.blogDirectory || 'blog',
  datePath: formatDatePath(uploadDate),
  contentType,
  url: publicUrl,
  r2: {
    bucket: config.bucket,
    key: objectKey,
    publicUrl,
    publicBaseUrl: config.publicBaseUrl,
    blogDirectory: args.blogDir || config.blogDirectory || 'blog',
    datePath: formatDatePath(uploadDate),
  },
  articleUpdated: Boolean(args.article && !args.dryRun),
  dryRun: Boolean(args.dryRun),
};

if (args.manifest && !args.dryRun) {
  await updateManifest(args.manifest, result);
}

console.log(JSON.stringify(result, null, 2));

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--help' || item === '-h') {
      parsed.help = true;
      continue;
    }

    if (!item.startsWith('--')) {
      throw new Error(`Unexpected argument "${item}". Options must start with "--".`);
    }

    const optionName = item.slice(2);
    const key = OPTION_ALIASES.get(optionName) || optionName;
    if (!BOOLEAN_OPTIONS.has(key) && !VALUE_OPTIONS.has(key)) {
      throw new Error(`Unknown option "${item}".`);
    }

    if (BOOLEAN_OPTIONS.has(key)) {
      parsed[key] = true;
      continue;
    }

    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for "${item}".`);
    }

    parsed[key] = value;
    i += 1;
  }
  return parsed;
}

function printUsage() {
  console.log(`Usage:
  node writer/scripts/upload-r2.mjs --file <image-path> [options]

Options:
  --config <path>       Local config path; defaults to writer/config/r2.config.json
                        If the default config is absent, upload is skipped successfully
  --key <object-key>    Override object key; default is <keyPrefix>/<blogDirectory>/yyyy/mm/dd/<filename>
  --blogDir <dir>       Blog image directory; defaults to config.blogDirectory or blog
  --date <yyyy-mm-dd>   Upload date path; defaults to today
  --seoName <text>      SEO-friendly image basename source; sanitized to letters/numbers
  --keyword <text>      Keyword metadata and fallback SEO filename source
  --topic <text>        Topic metadata and fallback SEO filename source
  --article <path>      Replace local Markdown image references in article.md
  --manifest <path>     Save/update upload URL mapping JSON
  --alt <text>          Alt text to use when inserting/replacing image Markdown
  --contentType <type>  Defaults by file extension
  --noCompress          Upload the source file without local image compression
  --compressionQuality <1-100>
                         WebP quality for local compression; defaults to 88
  --compressionFormat <webp>
                         Compressed upload format; defaults to webp
  --compressedFile <path>
                         Override the local compressed image output path
  --minCompressionSavingsPercent <number>
                         Use compressed file only when savings meet this percent; defaults to 3
  --dryRun, --dry-run   Print key and URL without uploading or editing article/manifest files

Example:
  node writer/scripts/upload-r2.mjs \\
    --file writer/output/my-post/hero-16x9.png \\
    --seoName "Seedance 2.0 AI video hero" \\
    --keyword "Seedance 2.0 AI" \\
    --topic "AI video generation" \\
    --article writer/output/my-post/article.md \\
    --manifest writer/output/my-post/image-urls.json \\
    --alt "Seedance 2.0 AI video generation hero image"`);
}

function validateConfig(config, configPath) {
  const required = ['accountId', 'bucket', 'accessKeyId', 'secretAccessKey', 'publicBaseUrl'];
  const missing = required.filter((key) => !config[key] || String(config[key]).startsWith('your-'));
  if (missing.length) {
    throw new Error(`Missing or placeholder R2 config fields in ${configPath}: ${missing.join(', ')}`);
  }
}

async function loadConfig(parsedArgs) {
  const configPath = parsedArgs.config || DEFAULT_CONFIG;
  if (!await fileExists(configPath)) {
    if (parsedArgs.config) {
      throw new Error(`R2 config not found: ${configPath}`);
    }
    return null;
  }

  return {
    label: configPath,
    config: JSON.parse(await readFile(configPath, 'utf8')),
  };
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function prepareImageForUpload(filePath, parsedArgs) {
  const originalStats = await stat(filePath);
  const compression = {
    enabled: !parsedArgs.noCompress,
    attempted: false,
    usedCompressed: false,
    sourceFile: filePath,
    uploadFile: filePath,
    originalBytes: originalStats.size,
    compressedFile: null,
    compressedBytes: null,
    savedBytes: 0,
    savedPercent: 0,
    format: null,
    quality: null,
    tool: null,
    skippedReason: null,
  };

  if (!compression.enabled) {
    compression.skippedReason = 'disabled';
    return { uploadFile: filePath, compression };
  }

  const sourceExt = extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(sourceExt)) {
    compression.skippedReason = `unsupported image type: ${sourceExt || 'none'}`;
    return { uploadFile: filePath, compression };
  }

  const format = String(parsedArgs.compressionFormat || 'webp').toLowerCase();
  if (format !== 'webp') {
    throw new Error(`Unsupported --compressionFormat "${format}". Currently supported: webp.`);
  }

  const cwebpPath = await findExecutable('cwebp');
  if (!cwebpPath) {
    compression.skippedReason = 'cwebp not found';
    return { uploadFile: filePath, compression };
  }

  const quality = parseCompressionQuality(parsedArgs.compressionQuality || parsedArgs.quality || 88);
  const minSavingsPercent = parseNonNegativeNumber(
    parsedArgs.minCompressionSavingsPercent,
    3,
    '--minCompressionSavingsPercent',
  );
  const compressedFile = parsedArgs.compressedFile || buildCompressedFilePath(filePath, format);
  if (compressedFile === filePath) {
    throw new Error('--compressedFile must be different from --file.');
  }

  compression.attempted = true;
  compression.compressedFile = compressedFile;
  compression.format = format;
  compression.quality = quality;
  compression.tool = cwebpPath;

  await mkdir(dirname(compressedFile), { recursive: true });

  try {
    await runProcess(cwebpPath, [
      '-quiet',
      '-q',
      String(quality),
      '-alpha_q',
      '95',
      '-m',
      '6',
      '-metadata',
      'none',
      filePath,
      '-o',
      compressedFile,
    ]);
  } catch (error) {
    compression.skippedReason = `compression failed: ${error.message}`;
    return { uploadFile: filePath, compression };
  }

  const compressedStats = await stat(compressedFile);
  const savedBytes = originalStats.size - compressedStats.size;
  const savedPercent = originalStats.size > 0
    ? Number(((savedBytes / originalStats.size) * 100).toFixed(2))
    : 0;

  compression.compressedBytes = compressedStats.size;
  compression.savedBytes = savedBytes;
  compression.savedPercent = savedPercent;

  if (savedBytes <= 0) {
    compression.skippedReason = 'compressed file is not smaller than source';
    return { uploadFile: filePath, compression };
  }

  if (savedPercent < minSavingsPercent) {
    compression.skippedReason = `savings below ${minSavingsPercent}% threshold`;
    return { uploadFile: filePath, compression };
  }

  compression.usedCompressed = true;
  compression.uploadFile = compressedFile;
  return { uploadFile: compressedFile, compression };
}

function buildCompressedFilePath(filePath, format) {
  const sourceExt = extname(filePath);
  const sourceBase = basename(filePath, sourceExt);
  return join(dirname(filePath), `${sourceBase}-r2.${format}`);
}

function parseCompressionQuality(value) {
  const quality = Number(value);
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
    throw new Error(`Invalid --compressionQuality value "${value}". Use a number from 1 to 100.`);
  }
  return Math.round(quality);
}

function parseNonNegativeNumber(value, fallback, label) {
  if (value === undefined || value === null || value === true || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${label} value "${value}". Use a non-negative number.`);
  }
  return parsed;
}

async function findExecutable(name) {
  const pathValues = [
    ...String(process.env.PATH || '').split(delimiter),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
  ].filter(Boolean);

  for (const dir of pathValues) {
    const candidate = join(dir, name);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next path.
    }
  }
  return null;
}

function runProcess(command, processArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, processArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const message = (stderr || stdout || `${command} exited with code ${code}`).trim();
      reject(new Error(message));
    });
  });
}

function buildDefaultKey({ keyPrefix, blogDirectory, date, filePath, extensionPath, seoName }) {
  const { yyyy, mm, dd } = dateParts(date);
  return posix.join(
    keyPrefix || '',
    blogDirectory || 'blog',
    yyyy,
    mm,
    dd,
    buildSeoFilename({ filePath, extensionPath, seoName }),
  );
}

function normalizeKey(key) {
  return key.replace(/^\/+/, '').replace(/\\/g, '/');
}

function sanitizeObjectKeyFilename(key, extensionPath) {
  const normalized = normalizeKey(key);
  const parts = normalized.split('/');
  const filename = parts.pop() || 'image.png';
  parts.push(sanitizeFilename(filename, extensionPath));
  return parts.join('/');
}

function contentTypeFor(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

function sanitizeFilename(filename, extensionPath) {
  const sourceExt = extname(filename).toLowerCase();
  const ext = extname(extensionPath || filename).toLowerCase() || sourceExt || '.png';
  const base = basename(filename, sourceExt);
  const cleanedBase = base.replace(/[^a-zA-Z0-9]/g, '') || 'image';
  const cleanedExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
  return `${cleanedBase}${cleanedExt}`;
}

function buildSeoFilename({ filePath, extensionPath, seoName }) {
  const sourceExt = extname(filePath);
  const ext = extname(extensionPath || filePath).toLowerCase().replace(/[^a-zA-Z0-9.]/g, '') || '.png';
  const source = String(seoName || basename(filePath, sourceExt)).trim();
  const words = source.match(/[a-zA-Z0-9]+/g) || ['image'];
  const basenameOnly = words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (/^\d+$/.test(lower)) return lower;
      return index === 0
        ? lower
        : `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '') || 'image';
  return `${basenameOnly}${ext}`;
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function joinPublicUrl(publicBaseUrl, key) {
  const normalizedBaseUrl = /^https?:\/\//i.test(publicBaseUrl)
    ? publicBaseUrl
    : `https://${publicBaseUrl}`;
  return `${normalizedBaseUrl.replace(/\/+$/, '')}/${encodePath(key)}`;
}

async function replaceArticleImageUrl(articlePath, imagePath, publicUrl, altText) {
  const filename = basename(imagePath);
  const escapedFilename = escapeRegExp(filename);
  const markdownAlt = altText || filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  const article = await readFile(articlePath, 'utf8');
  const localImagePattern = new RegExp(`!\\[[^\\]]*\\]\\((?:\\./)?${escapedFilename}\\)`, 'g');
  const replacement = `![${markdownAlt}](${publicUrl})`;
  const next = localImagePattern.test(article)
    ? article.replace(localImagePattern, replacement)
    : article.replace(/^# .+$/m, (heading) => `${heading}\n\n${replacement}`);
  await writeFile(articlePath, next);
}

async function updateManifest(manifestPath, result) {
  let current = [];
  try {
    current = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (!Array.isArray(current)) current = [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const next = [
    ...current.filter((item) => item.file !== result.file && item.key !== result.key),
    {
      file: result.file,
      uploadedFile: result.uploadedFile,
      compression: result.compression,
      seoName: result.seoName,
      alt: result.alt,
      keyword: result.keyword,
      topic: result.topic,
      key: result.key,
      blogDirectory: result.blogDirectory,
      datePath: result.datePath,
      url: result.url,
      r2: result.r2,
      contentType: result.contentType,
      uploadedAt: new Date().toISOString(),
    },
  ];

  await writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
}

function parseUploadDate(value) {
  if (value instanceof Date) return value;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid --date value "${value}". Use yyyy-mm-dd.`);
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid --date value "${value}". Use yyyy-mm-dd.`);
  }
  return date;
}

function dateParts(date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return { yyyy, mm, dd };
}

function formatDatePath(date) {
  const { yyyy, mm, dd } = dateParts(date);
  return `${yyyy}/${mm}/${dd}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function putObject({ url, region, accessKeyId, secretAccessKey, body, contentType }) {
  const target = new URL(url);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const encodedPath = target.pathname
    .split('/')
    .map((part) => encodeURIComponent(decodeURIComponent(part)))
    .join('/');

  const headers = {
    'content-type': contentType,
    host: target.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };

  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}\n`)
    .join('');
  const canonicalRequest = [
    'PUT',
    encodedPath,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = hmacHex(signingKey, stringToSign);

  headers.authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');

  const response = await fetch(target, {
    method: 'PUT',
    headers,
    body,
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`R2 upload failed: ${response.status} ${response.statusText}\n${responseBody}`);
  }
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key, value) {
  return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key, value) {
  return createHmac('sha256', key).update(value).digest('hex');
}

function getSignatureKey(secretAccessKey, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}
