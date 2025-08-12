#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { downloadCommand } from './commands/download';
import { listCommand } from './commands/list';
import { transcribeCommand } from './commands/transcribe';

const program = new Command();

program
  .name('podcast-manager')
  .description('Universal tool for downloading and transcribing podcasts from any RSS feed')
  .version('0.2.0');

// Download command - main command for any podcast
program
  .command('download')
  .description('Download episodes from any podcast RSS feed')
  .requiredOption('-r, --rss <url>', 'RSS feed URL for the podcast')
  .option('-e, --episode <number>', 'Specific episode number or ID')
  .option('-l, --latest [count]', 'Download the N latest episodes (default: 1)', '1')
  .option('-o, --output <path>', 'Output folder', './downloads')
  .option('--range <start-end>', 'Download episodes in a range (e.g. 1-10)')
  .option('--title <pattern>', 'Download episodes matching title (regex supported)')
  .action(downloadCommand);

// List command - inspect any feed
program
  .command('list')
  .description('List episodes from RSS feed to explore content')
  .requiredOption('-r, --rss <url>', 'RSS feed URL')
  .option('-c, --count <number>', 'Number of episodes to show', '10')
  .option('--format', 'Show detailed RSS format information')
  .action(listCommand);

// Transcribe command
program
  .command('transcribe')
  .description('Transcribe downloaded podcast episodes')
  .option('-i, --input <path>', 'Input file or folder')
  .option('-o, --output <path>', 'Output folder for transcription', './transcripts')
  .action(transcribeCommand);

// Info command - analyze RSS feed structure
program
  .command('info')
  .description('Analyze RSS feed structure and metadata')
  .requiredOption('-r, --rss <url>', 'RSS feed URL')
  .action(async (options) => {
    console.log(chalk.blue('🔍 Analyzing RSS feed structure...'));
    // This will be implemented to help debug different RSS formats
    const { analyzeRssFeed } = await import('./commands/analyze');
    await analyzeRssFeed(options);
  });

export function main() {
  if (process.argv.length === 2) {
    console.log(chalk.blue('🎙️  Podcast Manager - Universal podcast tool'));
    console.log(chalk.gray('   Supports all podcasts with RSS feeds\n'));
    program.help();
  } else {
    program.parse();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}
