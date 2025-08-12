import Parser from 'rss-parser';
import axios from 'axios';
import { createWriteStream, mkdirSync } from 'fs';
import { join, extname } from 'path';
import chalk from 'chalk';
import ProgressBar from 'progress';

interface DownloadOptions {
  rss?: string;
  episode?: string;
  latest?: string;
  output?: string;
}

export async function downloadCommand(options: DownloadOptions) {
  try {
    if (!options.rss) {
      console.error(chalk.red('❌ RSS feed URL er påkrevd'));
      process.exit(1);
    }

    console.log(chalk.blue('🔍 Henter RSS feed...'));
    const parser = new Parser();
    const feed = await parser.parseURL(options.rss);

    console.log(chalk.green(`📻 Funnet: ${feed.title}`));
    console.log(chalk.gray(`   ${feed.description?.substring(0, 100)}...`));

    // Ensure output directory exists
    const outputDir = options.output || './downloads';
    mkdirSync(outputDir, { recursive: true });

    let episodesToDownload: any[] = [];

    if (options.episode) {
      // Download specific episode
      const episodeNumber = parseInt(options.episode);
      const episode = feed.items?.find(item => {
        const title = item.title?.toLowerCase();
        return title?.includes(`episode ${episodeNumber}`) || 
               title?.includes(`ep. ${episodeNumber}`) ||
               title?.includes(`${episodeNumber}`);
      });

      if (!episode) {
        console.error(chalk.red(`❌ Episode ${episodeNumber} ikke funnet`));
        process.exit(1);
      }
      episodesToDownload = [episode];
    } else {
      // Download latest episodes
      const count = parseInt(options.latest || '1');
      episodesToDownload = feed.items?.slice(0, count) || [];
    }

    for (const episode of episodesToDownload) {
      await downloadEpisode(episode, outputDir);
    }

    console.log(chalk.green('✅ Nedlasting fullført!'));
  } catch (error) {
    console.error(chalk.red('❌ Feil ved nedlasting:'), error);
    process.exit(1);
  }
}

async function downloadEpisode(episode: any, outputDir: string) {
  try {
    console.log(chalk.blue(`\n🎵 Laster ned: ${episode.title}`));
    
    // Find audio URL
    let audioUrl: string | undefined;
    
    // Check enclosures (standard RSS)
    if (episode.enclosures && episode.enclosures.length > 0) {
      audioUrl = episode.enclosures.find((enc: any) => 
        enc.type?.includes('audio')
      )?.url;
    }
    
    // Fallback: check for link property
    if (!audioUrl && episode.link) {
      audioUrl = episode.link;
    }
    
    if (!audioUrl) {
      console.error(chalk.red('❌ Ingen lydlenke funnet'));
      return;
    }

    // Clean up filename
    const filename = sanitizeFilename(episode.title || 'episode') + '.mp3';
    const filepath = join(outputDir, filename);

    console.log(chalk.gray(`   URL: ${audioUrl}`));
    console.log(chalk.gray(`   Fil: ${filepath}`));

    // Download with progress bar
    const response = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
      timeout: 60000, // 1 minute timeout
    });

    const totalSize = parseInt(response.headers['content-length'] || '0');
    const progressBar = new ProgressBar(
      chalk.cyan('   Downloading [:bar] :percent :etas'),
      {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: totalSize,
      }
    );

    const writer = createWriteStream(filepath);
    response.data.pipe(writer);

    response.data.on('data', (chunk: any) => {
      progressBar.tick(chunk.length);
    });

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(chalk.green(`   ✅ ${filename}`));
        resolve(filepath);
      });
      writer.on('error', reject);
      response.data.on('error', reject);
    });

  } catch (error) {
    console.error(chalk.red(`❌ Feil ved nedlasting av episode: ${error}`));
  }
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 100); // Limit length
}
