#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { downloadCommand } from './commands/download';
import { listCommand } from './commands/list';
import { transcribeCommand } from './commands/transcribe';

const program = new Command();

program
  .name('podcast-manager')
  .description('Profesjonell verktøy for nedlasting og transkribering av podcaster')
  .version('0.1.0');

// Download command
program
  .command('download')
  .description('Last ned podcaster fra RSS feed')
  .option('-r, --rss <url>', 'RSS feed URL')
  .option('-e, --episode <number>', 'Spesifikk episode nummer')
  .option('-l, --latest [count]', 'Last ned de N nyeste episodene (default: 1)', '1')
  .option('-o, --output <path>', 'Output mappe', './downloads')
  .action(downloadCommand);

// List command
program
  .command('list')
  .description('List episoder fra RSS feed')
  .option('-r, --rss <url>', 'RSS feed URL')
  .option('-c, --count <number>', 'Antall episoder å vise', '10')
  .action(listCommand);

// Transcribe command
program
  .command('transcribe')
  .description('Transkriber nedlastede podcast-episoder')
  .option('-i, --input <path>', 'Input fil eller mappe')
  .option('-o, --output <path>', 'Output mappe for transkripsjon', './transcripts')
  .action(transcribeCommand);

// Preset commands for known podcasts
program
  .command('tid-er-penger')
  .description('Last ned fra Tid er Penger podcast')
  .option('-e, --episode <number>', 'Episode nummer')
  .option('-l, --latest [count]', 'Nyeste episoder', '1')
  .action(async (options) => {
    console.log(chalk.blue('📻 Laster ned fra Tid er Penger...'));
    await downloadCommand({
      rss: 'https://feeds.acast.com/public/shows/659c418069d2da0016ac759b',
      ...options
    });
  });

program
  .command('paradigmepodden')
  .description('Last ned fra Paradigmepodden')
  .option('-e, --episode <number>', 'Episode nummer')
  .option('-l, --latest [count]', 'Nyeste episoder', '1')
  .action(async (options) => {
    console.log(chalk.blue('📻 Laster ned fra Paradigmepodden...'));
    await downloadCommand({
      rss: 'https://feeds.acast.com/public/shows/6310559b290e6d00127e144f',
      ...options
    });
  });

export function main() {
  program.parse();
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}
