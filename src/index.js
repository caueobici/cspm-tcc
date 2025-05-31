#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { RuleEvaluator } from './core/rule-evaluator.js';
import { loadModules } from './core/module-loader.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const program = new Command();

program
  .name('aws-cspm')
  .description('AWS Cloud Security Posture Management Tool')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan AWS resources against security rules')
  .option('-r, --rules-dir <path>', 'Directory containing rule files', join(__dirname, '../rules'))
  .option('-m, --modules-dir <path>', 'Directory containing AWS service modules', join(__dirname, './modules'))
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Starting AWS CSPM scan...'));
      
      // Load all modules
      const modules = await loadModules(options.modulesDir);
      
      // Load and evaluate rules
      const evaluator = new RuleEvaluator(modules);
      const results = await evaluator.evaluateRules(options.rulesDir);
      
      // Print results
      console.log('\n📊 Scan Results:');
      results.forEach(result => {
        const status = result.passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
        console.log(`${status} ${result.ruleFile}: ${result.message}`);
      });
      
    } catch (error) {
      console.error(chalk.red('Error during scan:'), error);
      process.exit(1);
    }
  });

program.parse(); 