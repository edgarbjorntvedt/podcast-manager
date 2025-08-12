import Parser from 'rss-parser';
import chalk from 'chalk';

interface ListOptions {
  rss: string;
  count?: string;
  format?: boolean;
}

export async function listCommand(options: ListOptions) {
  try {
    console.log(chalk.blue('🔍 Fetching RSS feed...'));
    
    // Enhanced parser with custom fields for better episode detection
    const parser = new Parser({
      customFields: {
        feed: ['language', 'copyright', 'managingEditor', 'generator', 'lastBuildDate'],
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
          ['itunes:explicit', 'itunesExplicit'],
          'guid'
        ]
      }
    });
    
    const feed = await parser.parseURL(options.rss);

    // Display feed information
    console.log(chalk.green(`\n📻 ${feed.title}`));
    console.log(chalk.gray(`   ${feed.description?.substring(0, 150)}${feed.description && feed.description.length > 150 ? '...' : ''}`));
    console.log(chalk.gray(`   Language: ${feed.language || 'Unknown'}`));
    console.log(chalk.gray(`   Total episodes: ${feed.items?.length || 0}`));
    
    if ((feed as any).lastBuildDate) {
      console.log(chalk.gray(`   Last updated: ${new Date((feed as any).lastBuildDate).toLocaleDateString('en-US')}`));
    }
    
    if (options.format) {
      console.log(chalk.yellow('\n📊 RSS Format Analysis:'));
      displayFormatInfo(feed);
      return;
    }

    const count = parseInt(options.count || '10');
    const episodes = feed.items?.slice(0, count) || [];

    console.log(chalk.blue(`\n📋 Showing ${episodes.length} episodes:\n`));

    episodes.forEach((episode, index) => {
      const episodeInfo = extractEpisodeInfo(episode);
      const date = episode.pubDate ? new Date(episode.pubDate).toLocaleDateString('en-US') : 'Unknown date';
      const duration = extractDuration(episode);
      
      console.log(chalk.cyan(`${(index + 1).toString().padStart(3, ' ')}. `), 
                  chalk.white(episode.title));
      
      // Episode number from various sources
      if (episodeInfo.number) {
        console.log(chalk.gray(`     Episode: ${episodeInfo.number} (${episodeInfo.source})`));
      }
      
      // Season information
      if (episodeInfo.season) {
        console.log(chalk.gray(`     Season: ${episodeInfo.season}`));
      }
      
      console.log(chalk.gray(`     Date: ${date}`));
      
      if (duration) {
        console.log(chalk.gray(`     Duration: ${duration}`));
      }
      
      // Show audio availability
      const hasAudio = checkAudioAvailability(episode);
      console.log(chalk.gray(`     Audio: ${hasAudio.available ? '✅' : '❌'} ${hasAudio.source || 'No source found'}`));
      
      if (episode.contentSnippet) {
        const snippet = episode.contentSnippet.substring(0, 100) + (episode.contentSnippet.length > 100 ? '...' : '');
        console.log(chalk.gray(`     ${snippet}`));
      }
      console.log(); // Empty line
    });

  } catch (error) {
    console.error(chalk.red('❌ Error fetching episodes:'), error);
    process.exit(1);
  }
}

function extractEpisodeInfo(episode: any): { number?: string; season?: string; source: string } {
  // Try different sources for episode numbering
  if (episode.itunesEpisode) {
    return {
      number: episode.itunesEpisode,
      season: episode.itunesSeason,
      source: 'iTunes'
    };
  }
  
  if (episode.episode) {
    return {
      number: episode.episode,
      season: episode.season,
      source: 'RSS field'
    };
  }
  
  // Extract from title
  const title = episode.title || '';
  const episodeMatch = title.match(/(?:episode|ep\.?\s*|#)(\d+)/i);
  const seasonMatch = title.match(/(?:season|s)(\d+)/i);
  
  if (episodeMatch) {
    return {
      number: episodeMatch[1],
      season: seasonMatch?.[1],
      source: 'title'
    };
  }
  
  return { source: 'none' };
}

function extractDuration(episode: any): string | null {
  if (episode.itunesDuration) {
    return formatDuration(episode.itunesDuration);
  }
  
  if (episode.duration) {
    return formatDuration(episode.duration);
  }
  
  return null;
}

function formatDuration(duration: string | number): string {
  if (typeof duration === 'number') {
    // Duration in seconds
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  if (typeof duration === 'string') {
    // Already formatted or in HH:MM:SS format
    if (duration.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
      return duration;
    }
    
    // Try to parse as seconds
    const seconds = parseInt(duration);
    if (!isNaN(seconds)) {
      return formatDuration(seconds);
    }
  }
  
  return duration.toString();
}

function checkAudioAvailability(episode: any): { available: boolean; source?: string } {
  if (episode.enclosure?.url) {
    return { available: true, source: 'enclosure' };
  }
  
  if (episode.enclosures?.length > 0) {
    const audioEnclosure = episode.enclosures.find((enc: any) => 
      enc.type?.includes('audio') || enc.url?.match(/\.(mp3|m4a|wav|aac)($|\?)/i)
    );
    if (audioEnclosure) {
      return { available: true, source: 'enclosures[]' };
    }
  }
  
  if (episode.mediaContent?.url) {
    return { available: true, source: 'media:content' };
  }
  
  const guid = typeof episode.guid === 'string' ? episode.guid : episode.guid?._;
  if (guid?.startsWith('http') && guid.match(/\.(mp3|m4a|wav|aac)($|\?)/i)) {
    return { available: true, source: 'guid' };
  }
  
  return { available: false };
}

function displayFormatInfo(feed: any) {
  console.log(chalk.gray(`\n🏢 Feed Metadata:`));
  console.log(chalk.gray(`   Generator: ${feed.generator || 'Unknown'}`));
  console.log(chalk.gray(`   Managing Editor: ${feed.managingEditor || 'Unknown'}`));
  console.log(chalk.gray(`   Copyright: ${feed.copyright || 'Unknown'}`));
  
  if (feed.items && feed.items.length > 0) {
    console.log(chalk.gray(`\n📋 Episode Structure (first episode):`));
    const firstEpisode = feed.items[0];
    const keys = Object.keys(firstEpisode);
    
    keys.forEach(key => {
      const value = (firstEpisode as any)[key];
      const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
      console.log(chalk.gray(`   ${key.padEnd(20)}: ${type}`));
    });
  }
}

// Function moved and enhanced as extractEpisodeInfo above
