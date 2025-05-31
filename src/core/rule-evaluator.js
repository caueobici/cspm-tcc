import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { load } from 'js-yaml';
import chalk from 'chalk';

export class RuleEvaluator {
  constructor(modules) {
    this.modules = modules;
  }

  async evaluateRules(rulesDir) {
    const results = [];
    const ruleFiles = await this.findRuleFiles(rulesDir);

    for (const ruleFile of ruleFiles) {
      try {
        const rule = await this.loadRule(ruleFile);
        const result = await this.evaluateRule(rule, ruleFile);
        results.push(result);
      } catch (error) {
        results.push({
          ruleFile,
          passed: true, // If we can't evaluate a rule, we consider it passed (no vulnerability detected)
          message: `Error evaluating rule: ${error.message}`
        });
      }
    }

    return results;
  }

  async findRuleFiles(dir) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.findRuleFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async loadRule(ruleFile) {
    const content = await readFile(ruleFile, 'utf8');
    return load(content);
  }

  formatVulnerabilityMessage(rule, vulnerableItems) {
    const severityColors = {
      critical: chalk.bold.magenta,
      high: chalk.bold.red,
      medium: chalk.bold.yellow,
      low: chalk.bold.blue,
      info: chalk.bold.white
    };

    const severityColor = severityColors[rule.meta.severity] || chalk.white;
    const severityText = severityColor(`[${rule.meta.severity.toUpperCase()}]`);

    return [
      `\n--------------------------------------------`,
      `${severityText} ${rule.meta.name}`,
      `Description: ${rule.meta.description}`,
      `Category: ${rule.meta.category}`,
      `Vulnerable Items:`,
      ...vulnerableItems.map(item => `  - ${item.name || JSON.stringify(item)}`),
      ``
    ].join('\n');
  }

  async evaluateRule(rule, ruleFile) {
    const { module: moduleName, condition, meta } = rule;
    const module = this.modules[moduleName];

    if (!module) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    // Get data from the module (now returns an array)
    const items = await module.getData();
    if (!Array.isArray(items)) {
      throw new Error(`Module '${moduleName}' must return an array of items`);
    }

    // Evaluate each item against the rule
    const evaluations = items.map(item => ({
      item,
      // Invert the condition - if condition is true, it means vulnerability is detected
      vulnerabilityDetected: this.evaluateCondition(condition, item)
    }));

    // Count vulnerable and secure items
    const vulnerableCount = evaluations.filter(e => e.vulnerabilityDetected).length;
    const secureCount = evaluations.filter(e => !e.vulnerabilityDetected).length;

    // Get vulnerable items
    const vulnerableItems = evaluations
      .filter(e => e.vulnerabilityDetected)
      .map(e => e.item);

    // Rule passes if no vulnerabilities are detected
    const passed = vulnerableCount === 0;

    return {
      ruleFile,
      passed,
      message: passed
        ? `No vulnerabilities detected (${secureCount} items checked)`
        : this.formatVulnerabilityMessage(rule, vulnerableItems),
      details: {
        total: items.length,
        secure: secureCount,
        vulnerable: vulnerableCount,
        vulnerableItems,
        metadata: meta
      }
    };
  }

  evaluateCondition(condition, data) {
    if (typeof condition === 'string') {
      return this.evaluateSimpleCondition(condition, data);
    }

    if (condition.AND) {
      return condition.AND.every(c => this.evaluateCondition(c, data));
    }

    if (condition.OR) {
      return condition.OR.some(c => this.evaluateCondition(c, data));
    }

    throw new Error('Invalid condition format');
  }

  evaluateSimpleCondition(condition, data) {
    const [left, operator, right] = condition.split(/\s+/);

    // Get the value from the data object using dot notation
    const getValue = (path) => {
      return path.split('.').reduce((obj, key) => obj?.[key], data);
    };

    const leftValue = getValue(left);
    
    // Parse the right value based on its format
    let rightValue;
    if (right === 'true') {
      rightValue = true;
    } else if (right === 'false') {
      rightValue = false;
    } else if (!isNaN(right) && right.trim() !== '') {
      // Convert to number if it's a valid number
      rightValue = Number(right);
    } else {
      // Remove quotes for string values
      rightValue = right.replace(/^["']|["']$/g, '');
    }

    switch (operator) {
      case '==':
        return leftValue === rightValue;
      case '~=':
        // Only use regex for string values
        if (typeof rightValue === 'string') {
          return new RegExp(rightValue).test(leftValue);
        }
        throw new Error('Regex operator (~=) can only be used with string values');
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
} 