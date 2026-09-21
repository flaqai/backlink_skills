import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(testDirectory, '..', 'scripts', 'upload-r2.mjs');
const repositoryRoot = join(testDirectory, '..', '..', '..');

function runUpload(args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });

  return {
    ...result,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

test('accepts known value and boolean options without uploading in either dry-run form', async () => {
  const fixtureDirectory = await mkdtemp(join(tmpdir(), 'upload-r2-test-'));
  try {
    const imagePath = join(fixtureDirectory, 'hero.png');
    const configPath = join(fixtureDirectory, 'r2.json');
    const articlePath = join(fixtureDirectory, 'article.md');
    const manifestPath = join(fixtureDirectory, 'manifest.json');
    const articleBefore = '![hero](hero.png)\n';

    await writeFile(imagePath, 'test image');
    await writeFile(configPath, JSON.stringify({
      accountId: 'test-account',
      bucket: 'test-bucket',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      publicBaseUrl: 'https://cdn.example.com',
    }));
    await writeFile(articlePath, articleBefore);

    for (const dryRunFlag of ['--dryRun', '--dry-run']) {
      const result = runUpload([
        '--file', imagePath,
        '--config', configPath,
        '--key', 'images/hero.png',
        '--date', '2026-08-23',
        '--blogDir', 'blog',
        '--article', articlePath,
        '--manifest', manifestPath,
        '--noCompress',
        dryRunFlag,
      ]);

      assert.equal(result.status, 0, result.stderr);
      const output = JSON.parse(result.stdout);
      assert.equal(output.dryRun, true);
      assert.equal(output.key, 'images/hero.png');
      assert.equal(await readFile(articlePath, 'utf8'), articleBefore);
      await assert.rejects(readFile(manifestPath, 'utf8'), { code: 'ENOENT' });
    }
  } finally {
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
});

test('rejects unknown options with a non-zero exit code', () => {
  const result = runUpload(['--dry-rnu']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown option "--dry-rnu"/);
});

test('rejects value options without a value with a non-zero exit code', () => {
  const result = runUpload(['--file']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing value for "--file"/);
});
