import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

mkdirSync('.tmp', { recursive: true });

await build({
  entryPoints: ['tests/scenarioSave.test.ts'],
  outfile: '.tmp/scenarioSave.test.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  sourcemap: 'inline',
});

const result = spawnSync(process.execPath, ['--test', '.tmp/scenarioSave.test.mjs'], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
