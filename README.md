# Podcast Manager

A powerful, universal tool for downloading and transcribing podcasts from any RSS feed. Supports all podcast platforms and automatically adapts to different RSS formats.

## ✨ Features

- **Universal RSS support** - Works with all podcasts that have RSS feeds
- **Intelligent RSS parsing** - Automatically adapts to different feed formats
- **Advanced episode search** - Supports numbers, ranges, and title matching
- **RSS analysis tools** - Analyze feed structures for debugging
- **Smart audio detection** - Finds audio sources from multiple sources with prioritization
- **Platform detection** - Automatically detects Spotify, Apple Podcasts, Megaphone, Acast, and more
- **Complete internationalization** - English interface for global accessibility

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/edgarbjorntvedt/podcast-manager
cd podcast-manager

# Install dependencies
npm install

# Build project
npm run build

# Optional: Install globally
npm install -g .
```

## 📖 Usage

### Basic Commands

```bash
# Show help
podcast-manager --help

# List episodes from a podcast
podcast-manager list -r <RSS_URL>

# Download latest episode
podcast-manager download -r <RSS_URL>

# Analyze RSS feed structure
podcast-manager info -r <RSS_URL>
```

### Examples with Popular Podcasts

```bash
# Joe Rogan Experience
podcast-manager list -r https://feeds.megaphone.fm/GLT1412515089

# Tim Ferriss Show
podcast-manager download -r https://rss.art19.com/tim-ferriss-show --latest 3

# Any podcast with RSS feed
podcast-manager info -r https://feeds.acast.com/public/shows/659c418069d2da0016ac759b
```

## 🔧 Commands

### `list` - Explore podcast content

```bash
# List 10 latest episodes
podcast-manager list -r <RSS_URL>

# List 20 episodes
podcast-manager list -r <RSS_URL> -c 20

# Show detailed RSS format information
podcast-manager list -r <RSS_URL> --format
```

### `download` - Download episodes

```bash
# Download latest episode
podcast-manager download -r <RSS_URL>

# Download 5 latest episodes
podcast-manager download -r <RSS_URL> --latest 5

# Download specific episode
podcast-manager download -r <RSS_URL> --episode 123

# Download episode range
podcast-manager download -r <RSS_URL> --range 1-10

# Download episodes matching title (regex supported)
podcast-manager download -r <RSS_URL> --title "interview.*elon"

# Specify output folder
podcast-manager download -r <RSS_URL> -o ./my-podcasts
```

### `info` - Analyze RSS structure

```bash
# Analyze RSS feed for debugging
podcast-manager info -r <RSS_URL>
```

### `transcribe` - Transcribe episodes

```bash
# Transcribe downloaded files
podcast-manager transcribe -i ./downloads -o ./transcripts
```

## 🎯 Platform Support

The tool automatically supports various RSS formats and platforms:

### Supported Platforms
- **Spotify** (anchor.fm feeds)
- **Apple Podcasts** 
- **Megaphone**
- **Libsyn**
- **Buzzsprout**
- **Acast**
- **Art19**
- **PodBean**
- **All others** with standard RSS 2.0 feeds

### Audio Source Detection
The tool intelligently finds audio files using prioritized detection:

1. **Standard enclosure** - Most reliable RSS method
2. **Multiple enclosures** - With audio type preference
3. **Media content** - media:content tags
4. **GUID URLs** - Direct audio links
5. **Content parsing** - Extract from description/content
6. **Episode links** - Fallback solution

### Episode Identification
Multiple methods to find and identify episodes:
- iTunes episode tags (`itunes:episode`)
- Custom episode fields
- Title pattern matching (`Episode 123`, `Ep. 123`, `#123`)
- GUID pattern matching

## 🔍 Debugging

To troubleshoot RSS feeds that don't work:

```bash
# Set DEBUG environment variable
DEBUG=1 podcast-manager info -r <RSS_URL>

# Show detailed format information
podcast-manager list -r <RSS_URL> --format
```

This will show:
- All available fields in the RSS feed
- Audio sources found and their priority
- Episode numbering methods detected
- Platform detection results

## 📁 File Structure

```
downloads/          # Default download folder
transcripts/        # Default transcription folder
src/
  commands/
    analyze.ts      # RSS analysis command
    download.ts     # Download functionality
    list.ts         # Episode listing
    transcribe.ts   # Transcription functionality
  index.ts          # Main program
```

## 🛠 Development

```bash
# Development mode
npm run dev

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## 🤝 Contributing

If you find a podcast that doesn't work:

1. Run `podcast-manager info -r <RSS_URL>` 
2. Create an issue with the RSS URL and output
3. We can add support for that specific format

The tool is designed to be extensible and can easily support new RSS formats as they're encountered.

## 💡 Use Cases

- **Podcast archiving** - Download entire series for offline listening
- **Content analysis** - Transcribe episodes for research or accessibility
- **Automation** - Integrate into workflows for automatic episode processing
- **Cross-platform** - Works with any podcast regardless of hosting platform
- **Development** - Debug RSS feeds and understand podcast metadata

## 📝 License

MIT - See [LICENSE](LICENSE) file.
