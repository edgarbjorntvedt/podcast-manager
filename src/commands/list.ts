import Parser from 'rss-parser';
import chalk from 'chalk';

interface ListOptions {
  rss?: string;
  count?: string;
}

export async function listCommand(options: ListOptions) {
  try {
    if (!options.rss) {
      console.error(chalk.red('❌ RSS feed URL er påkrevd'));
      process.exit(1);
    }

    console.log(chalk.blue('🔍 Henter RSS feed...'));
    const parser = new Parser();
    const feed = await parser.parseURL(options.rss);

    console.log(chalk.green(`\n📻 ${feed.title}`));
    console.log(chalk.gray(`   ${feed.description}`));
    console.log(chalk.gray(`   Totalt: ${feed.items?.length || 0} episoder`));

    const count = parseInt(options.count || '10');
    const episodes = feed.items?.slice(0, count) || [];

    console.log(chalk.blue(`\n📋 Viser ${episodes.length} episoder:\n`));

    episodes.forEach((episode, index) => {
      const episodeNumber = extractEpisodeNumber(episode.title || '');
      const date = episode.pubDate ? new Date(episode.pubDate).toLocaleDateString('nb-NO') : 'Ukjent dato';
      
      console.log(chalk.cyan(`${(index + 1).toString().padStart(3, ' ')}. `), 
                  chalk.white(episode.title));
      if (episodeNumber) {
        console.log(chalk.gray(`     Episode: ${episodeNumber}`));
      }
      console.log(chalk.gray(`     Dato: ${date}`));
      if (episode.contentSnippet) {
        const snippet = episode.contentSnippet.substring(0, 80) + (episode.contentSnippet.length > 80 ? '...' : '');
        console.log(chalk.gray(`     ${snippet}`));
      }
      console.log(); // Empty line
    });

  } catch (error) {
    console.error(chalk.red('❌ Feil ved henting av episoder:'), error);
    process.exit(1);
  }
}

function extractEpisodeNumber(title: string): string | null {
  const matches = title.match(/episode\s+(\d+)|ep\.?\s*(\d+)|(\d+)/i);
  return matches ? (matches[1] || matches[2] || matches[3]) : null;
}
