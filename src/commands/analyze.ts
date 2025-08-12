import Parser from 'rss-parser';
import chalk from 'chalk';

interface AnalyzeOptions {
  rss: string;
}

export async function analyzeRssFeed(options: AnalyzeOptions) {
  try {
    console.log(chalk.blue('🔍 Analyzing RSS feed...'));
    
    const parser = new Parser({
      customFields: {
        feed: ['language', 'copyright', 'managingEditor', 'webMaster', 'lastBuildDate'],
        item: [
          'duration',
          'episode', 
          'season',
          'episodeType',
          'explicit',
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

    // Basic feed info
    console.log(chalk.green(`\n📻 ${feed.title}`));
    console.log(chalk.gray(`   ${feed.description?.substring(0, 200)}...`));
    console.log(chalk.gray(`   Language: ${feed.language || 'Unknown'}`));
    console.log(chalk.gray(`   Total episodes: ${feed.items?.length || 0}`));
    console.log(chalk.gray(`   Last updated: ${(feed as any).lastBuildDate || 'Unknown'}`));

    if (feed.items && feed.items.length > 0) {
      console.log(chalk.blue('\n🔍 Analyzing RSS structure based on first episode:'));
      
      const firstEpisode = feed.items[0];
      const episodeKeys = Object.keys(firstEpisode);
      
      console.log(chalk.yellow('\n📋 Available fields:'));
      episodeKeys.forEach(key => {
        const value = (firstEpisode as any)[key];
        const valueType = Array.isArray(value) ? 'array' : typeof value;
        let preview = '';
        
        try {
          if (value === null || value === undefined) {
            preview = 'null/undefined';
          } else if (typeof value === 'object') {
            preview = JSON.stringify(value).substring(0, 50);
          } else {
            preview = String(value).substring(0, 50);
          }
          
          if (preview.length > 50) preview += '...';
        } catch (error) {
          preview = '[complex object]';
        }
        
        console.log(chalk.gray(`   ${key.padEnd(20)} (${valueType}): ${preview}`));
      });

      // Analyze audio URL patterns
      console.log(chalk.yellow('\n🎵 Audio URL analysis:'));
      analyzeAudioSources(firstEpisode);
      
      // Check episode numbering patterns
      console.log(chalk.yellow('\n🔢 Episode numbering:'));
      analyzeEpisodeNumbering(feed.items.slice(0, 5));
      
      // Platform detection
      console.log(chalk.yellow('\n🏢 Platform detection:'));
      detectPlatform(feed, options.rss);
    }

  } catch (error) {
    console.error(chalk.red('❌ Analysis error:'), error);
    process.exit(1);
  }
}

function analyzeAudioSources(episode: any) {
  const sources: string[] = [];
  
  // Standard enclosure
  if (episode.enclosure?.url) {
    sources.push(`enclosure.url: ${episode.enclosure.url}`);
  }
  
  // Multiple enclosures
  if (episode.enclosures?.length > 0) {
    episode.enclosures.forEach((enc: any, i: number) => {
      sources.push(`enclosures[${i}]: ${enc.url} (${enc.type})`);
    });
  }
  
  // Media content
  if (episode.mediaContent?.url) {
    sources.push(`media:content: ${episode.mediaContent.url}`);
  }
  
  // GUID as URL
  const guid = typeof episode.guid === 'string' ? episode.guid : episode.guid?._;
  if (guid?.startsWith('http')) {
    sources.push(`guid: ${guid}`);
  }
  
  // Link
  if (episode.link?.includes('mp3') || episode.link?.includes('audio')) {
    sources.push(`link: ${episode.link}`);
  }
  
  if (sources.length === 0) {
    console.log(chalk.red('   ❌ No audio URLs found'));
    console.log(chalk.gray('   📝 Full episode data:'));
    console.log(chalk.gray(JSON.stringify(episode, null, 2)));
  } else {
    sources.forEach(source => console.log(chalk.green(`   ✅ ${source}`)));
  }
}

function analyzeEpisodeNumbering(episodes: any[]) {
  episodes.forEach((episode, i) => {
    const title = episode.title || '';
    const itunesEpisode = episode.itunesEpisode;
    const episodeField = episode.episode;
    
    const patterns: string[] = [];
    
    if (itunesEpisode) patterns.push(`itunes:episode = ${itunesEpisode}`);
    if (episodeField) patterns.push(`episode field = ${episodeField}`);
    
    // Extract from title
    const titleMatch = title.match(/(?:episode|ep\.?\s*|#)(\d+)/i);
    if (titleMatch) patterns.push(`title pattern = ${titleMatch[1]}`);
    
    console.log(chalk.gray(`   Episode ${i + 1}: ${patterns.join(', ') || 'No numbering found'}`));
  });
}

function detectPlatform(feed: any, rssUrl: string) {
  const platforms = [
    { name: 'Spotify', patterns: ['spotify', 'anchor.fm'] },
    { name: 'Apple Podcasts', patterns: ['podcasts.apple.com'] },
    { name: 'Megaphone', patterns: ['megaphone.fm'] },
    { name: 'Libsyn', patterns: ['libsyn'] },
    { name: 'Buzzsprout', patterns: ['buzzsprout'] },
    { name: 'Acast', patterns: ['acast.com'] },
    { name: 'Art19', patterns: ['art19.com'] },
    { name: 'PodBean', patterns: ['podbean.com'] },
  ];
  
  const generator = feed.generator || '';
  const managingEditor = feed.managingEditor || '';
  
  for (const platform of platforms) {
    const matchesUrl = platform.patterns.some(pattern => 
      rssUrl.toLowerCase().includes(pattern.toLowerCase())
    );
    const matchesGenerator = platform.patterns.some(pattern => 
      generator.toLowerCase().includes(pattern.toLowerCase())
    );
    const matchesEditor = platform.patterns.some(pattern => 
      managingEditor.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (matchesUrl || matchesGenerator || matchesEditor) {
      console.log(chalk.green(`   ✅ Detected: ${platform.name}`));
      return;
    }
  }
  
  console.log(chalk.gray('   🤔 Unknown platform'));
  console.log(chalk.gray(`   Generator: ${generator}`));
  console.log(chalk.gray(`   Editor: ${managingEditor}`));
}
