#!/usr/bin/env node
/**
 * @file index.ts
 * @description milanote-project-creator CLI entry point
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import 'dotenv/config';
import { Command } from 'commander';

const program = new Command();

program
  .name('milanote-creator')
  .description('Create Milanote boards programmatically from JSON templates')
  .version('0.1.0');

program.parse();
