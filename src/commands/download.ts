import Parser from 'rss-parser';
import axios from 'axios';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import chalk from 'chalk';
import ProgressBar from 'progress';

interface DownloadOptions {
  rss: string;
  episode?: string;
  latest?: string;
  output?: string;
  range?: string;
  title?: string;
}

interface EpisodeMatch {
  episode: any;
  reason: string;
}

export async function downloadCommand(options: DownloadOptions) {
  try {
    console.log(chalk.blue('🔍 Fetching RSS feed...'));
    
    // Enhanced RSS parser with more custom fields
    const parser = new Parser({
      customFields: {
        feed: ['language', 'copyright'],
        item: [
          'duration',
          'episode', 
          'season',
          'episodeType',
          ['media:content', 'mediaContent'],
          ['content:encoded', 'contentEncoded'],
          ['itunes:duration', 'itunesDuration'],
          ['itunes:episode', 'itunesEpisode'],
          ['itunes:season', 'itunesSeason'],
          ['itunes:episodeType', 'itunesEpisodeType'],
          'guid'
        ]
      }
    });
    
    const feed = await parser.parseURL(options.rss);

    console.log(chalk.green(`📻 Found: ${feed.title}`));
    console.log(chalk.gray(`   ${feed.description?.substring(0, 100)}...`));
    console.log(chalk.gray(`   Total episodes: ${feed.items?.length || 0}`));

    // Ensure output directory exists
    const outputDir = options.output || './downloads';
    mkdirSync(outputDir, { recursive: true });

    const episodesToDownload = await findEpisodesToDownload(feed.items || [], options);
    
    if (episodesToDownload.length === 0) {
      console.log(chalk.yellow('⚠️ No episodes found matching the criteria'));
      return;
    }

    console.log(chalk.blue(`\n📥 Downloading ${episodesToDownload.length} episode(s):\n`));
    
    for (const { episode, reason } of episodesToDownload) {
      console.log(chalk.cyan(`🎵 ${episode.title}`));
      console.log(chalk.gray(`   Reason: ${reason}`));
      await downloadEpisode(episode, outputDir);
    }

    console.log(chalk.green('\n✅ Download completed!'));
  } catch (error) {
    console.error(chalk.red('❌ Download error:'), error);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

async function findEpisodesToDownload(items: any[], options: DownloadOptions): Promise<EpisodeMatch[]> {
  let matches: EpisodeMatch[] = [];
  
  if (options.episode) {
    // Find specific episode by number or ID
    const episodeId = options.episode;
    const episode = findEpisodeById(items, episodeId);
    
    if (!episode) {
      throw new Error(`Episode '${episodeId}' not found`);
    }
    
    matches.push({
      episode: episode.episode,
      reason: `Episode ID: ${episodeId} (${episode.method})`
    });
    
  } else if (options.range) {
    // Download range of episodes
    const [start, end] = options.range.split('-').map(n => parseInt(n.trim()));
    
    if (isNaN(start) || isNaN(end)) {
      throw new Error('Invalid range format. Use: --range 1-10');
    }
    
    for (let i = start; i <= end; i++) {
      const episode = findEpisodeById(items, i.toString());
      if (episode) {
        matches.push({
          episode: episode.episode,
          reason: `Range ${start}-${end}: Episode ${i}`
        });
      }
    }
    
  } else if (options.title) {
    // Find episodes by title pattern (supports regex)
    const pattern = new RegExp(options.title, 'i');
    
    for (const item of items) {
      if (pattern.test(item.title || '')) {
        matches.push({
          episode: item,
          reason: `Title matches: '${options.title}'`
        });
      }
    }
    
  } else {
    // Default: latest episodes
    const count = parseInt(options.latest || '1');
    const latest = items.slice(0, count);
    
    latest.forEach((item, index) => {
      matches.push({
        episode: item,
        reason: `${count === 1 ? 'Latest episode' : `Latest ${index + 1} of ${count}`}`
      });
    });
  }
  
  return matches;
}

function findEpisodeById(items: any[], episodeId: string): { episode: any; method: string } | null {
  // Try different methods to find episode
  const id = parseInt(episodeId);
  
  // Method 1: iTunes episode field
  let episode = items.find(item => item.itunesEpisode && parseInt(item.itunesEpisode) === id);
  if (episode) return { episode, method: 'itunes:episode' };
  
  // Method 2: Custom episode field
  episode = items.find(item => item.episode && parseInt(item.episode) === id);
  if (episode) return { episode, method: 'episode field' };
  
  // Method 3: Title patterns
  episode = items.find(item => {
    const title = item.title?.toLowerCase() || '';
    return title.includes(`episode ${id}`) || 
           title.includes(`ep. ${id}`) ||
           title.includes(`ep ${id}`) ||
           title.includes(`#${id}`);
  });
  if (episode) return { episode, method: 'title pattern' };
  
  // Method 4: GUID contains number
  episode = items.find(item => {
    const guid = typeof item.guid === 'string' ? item.guid : item.guid?._;
    return guid && guid.includes(episodeId);
  });
  if (episode) return { episode, method: 'GUID' };
  
  return null;
}

async function downloadEpisode(episode: any, outputDir: string) {
  try {
    // Check if file already exists
    const filename = sanitizeFilename(episode.title || 'episode') + '.mp3';
    const filepath = join(outputDir, filename);
    
    if (existsSync(filepath)) {
      console.log(chalk.yellow(`   ⚠️ File already exists: ${filename}`));
      return filepath;
    }
    
    // Find audio URL using enhanced detection
    const audioUrl = await findAudioUrl(episode);
    
    if (!audioUrl) {
      console.error(chalk.red('   ❌ No audio link found'));
      if (process.env.DEBUG) {
        console.log(chalk.gray('   📝 Episode data:'), JSON.stringify(episode, null, 2));
      }
      return;
    }

    console.log(chalk.gray(`   🔗 ${audioUrl}`));
    console.log(chalk.gray(`   💾 ${filepath}`));

    // Download with enhanced error handling
    const response = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
      timeout: 120000, // 2 minute timeout
      headers: {
        'User-Agent': 'PodcastManager/1.0 (https://github.com/user/podcast-manager)'
      },
      maxRedirects: 5
    });

    const totalSize = parseInt(response.headers['content-length'] || '0');
    const progressBar = new ProgressBar(
      chalk.cyan('   Downloading [:bar] :percent :etas :current/:total bytes'),
      {
        complete: '█',
        incomplete: '░',
        width: 30,
        total: totalSize,
        clear: false
      }
    );

    const writer = createWriteStream(filepath);
    response.data.pipe(writer);

    response.data.on('data', (chunk: any) => {
      progressBar.tick(chunk.length);
    });

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(chalk.green(`   ✅ ${filename} (${Math.round(totalSize / 1024 / 1024)}MB)`));
        resolve(filepath);
      });
      writer.on('error', reject);
      response.data.on('error', reject);
    });

  } catch (error: any) {
    console.error(chalk.red(`   ❌ Download error: ${error.message || error}`));
    
    if (error.response?.status) {
      console.error(chalk.red(`   HTTP Status: ${error.response.status}`));
    }
  }
}

async function findAudioUrl(episode: any): Promise<string | null> {
  const audioSources: { url: string; priority: number; source: string }[] = [];
  
  // Priority 1: Direct enclosure (most reliable)
  if (episode.enclosure?.url) {
    audioSources.push({
      url: episode.enclosure.url,
      priority: 1,
      source: 'enclosure'
    });
  }
  
  // Priority 2: Multiple enclosures - prefer audio types
  if (episode.enclosures?.length > 0) {
    episode.enclosures.forEach((enc: any, i: number) => {
      const isAudio = enc.type?.includes('audio') || 
                     enc.url?.match(/\.(mp3|m4a|wav|aac|ogg)($|\?)/i);
      audioSources.push({
        url: enc.url,
        priority: isAudio ? 2 : 4,
        source: `enclosures[${i}]`
      });
    });
  }
  
  // Priority 3: Media content
  if (episode.mediaContent?.url) {
    audioSources.push({
      url: episode.mediaContent.url,
      priority: 3,
      source: 'media:content'
    });
  }
  
  // Priority 4: GUID as direct URL
  const guid = typeof episode.guid === 'string' ? episode.guid : episode.guid?._;
  if (guid?.startsWith('http') && guid.match(/\.(mp3|m4a|wav|aac)($|\?)/i)) {
    audioSources.push({
      url: guid,
      priority: 4,
      source: 'guid'
    });
  }
  
  // Priority 5: Extract from content/description
  const contentFields = [
    episode.contentEncoded,
    episode['content:encoded'],
    episode.content,
    episode.description
  ];
  
  for (const content of contentFields) {
    if (content) {
      const urlMatch = content.match(/(https?:\/\/[^\s<>"']+\.(mp3|m4a|wav|aac|ogg)(?:[^\s<>"']*)?)/gi);
      if (urlMatch) {
        urlMatch.forEach((url: string) => {
          audioSources.push({
            url: url.replace(/["'<>]/g, ''), // Clean up
            priority: 5,
            source: 'content'
          });
        });
      }
    }
  }
  
  // Priority 6: Episode link as fallback
  if (episode.link?.match(/\.(mp3|m4a|wav|aac)($|\?)/i)) {
    audioSources.push({
      url: episode.link,
      priority: 6,
      source: 'link'
    });
  }
  
  // Sort by priority and return best match
  audioSources.sort((a, b) => a.priority - b.priority);
  
  if (process.env.DEBUG && audioSources.length > 0) {
    console.log(chalk.gray('   🔍 Found audio sources:'));
    audioSources.forEach(src => 
      console.log(chalk.gray(`      ${src.priority}. ${src.source}: ${src.url}`))
    );
  }
  
  return audioSources.length > 0 ? audioSources[0].url : null;
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file system characters
    .replace(/[\r\n\t]/g, '') // Remove line breaks and tabs
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Trim underscores from start/end
    .substring(0, 200) // Increased length limit
    .replace(/_+$/, ''); // Remove trailing underscores after truncation
}
