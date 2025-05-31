import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function loadModules(modulesDir) {
  const modules = {};
  const entries = await readdir(modulesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      try {
        const modulePath = join(modulesDir, entry.name, 'index.js');
        const module = await import(modulePath);
        modules[entry.name] = module.default;
      } catch (error) {
        console.warn(`Failed to load module ${entry.name}:`, error.message);
      }
    }
  }

  return modules;
} 