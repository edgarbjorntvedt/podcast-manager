# 🎙️ Podcast Manager

Profesjonell verktøy for nedlasting og transkribering av podcaster med RSS feed støtte og Whisper AI integrasjon.

## ✨ Features

- 📻 **RSS Feed Support**: Last ned fra alle podcaster med RSS feeds
- 🎯 **Smart Episode Selection**: Spesifikke episoder eller nyeste episoder
- 🎤 **AI Transkribering**: Automatisk transkribering med Whisper AI
- 🚀 **Built-in Presets**: Ferdigkonfigurerte commands for populære podcaster
- 📊 **Progress Tracking**: Visuell nedlasting-progress
- 🔧 **TypeScript**: Type-sikker og moderne kodeutvikling

## 🚀 Quick Start

```bash
# Installer
npm install -g podcast-manager

# List episoder
podcast-manager list --rss "https://feeds.example.com/podcast" --count 10

# Last ned nyeste episode
podcast-manager download --rss "https://feeds.example.com/podcast" --latest 1

# Last ned spesifikk episode
podcast-manager download --rss "https://feeds.example.com/podcast" --episode 123

# Transkriber lydfiler
podcast-manager transcribe --input ./downloads --output ./transcripts
```

## 📻 Built-in Podcast Presets

### Tid er Penger (Peter Warren)
```bash
# List episoder
podcast-manager list --rss "https://feeds.acast.com/public/shows/659c418069d2da0016ac759b"

# Last ned nyeste episode
podcast-manager tid-er-penger --latest 1

# Last ned spesifikk episode
podcast-manager tid-er-penger --episode 327
```

### Paradigmepodden
```bash
# Last ned fra Paradigmepodden
podcast-manager paradigmepodden --latest 3
```

## 📋 Commands

### `download`
Last ned podcaster fra RSS feed
```bash
podcast-manager download [options]

Options:
  -r, --rss <url>        RSS feed URL
  -e, --episode <number> Spesifikk episode nummer
  -l, --latest [count]   Last ned de N nyeste episodene (default: 1)
  -o, --output <path>    Output mappe (default: ./downloads)
```

### `list`
List episoder fra RSS feed
```bash
podcast-manager list [options]

Options:
  -r, --rss <url>       RSS feed URL
  -c, --count <number>  Antall episoder å vise (default: 10)
```

### `transcribe`
Transkriber nedlastede podcast-episoder med Whisper AI
```bash
podcast-manager transcribe [options]

Options:
  -i, --input <path>   Input fil eller mappe
  -o, --output <path>  Output mappe for transkripsjon (default: ./transcripts)
```

## 🛠️ Installation

### Prerequisites
- Node.js (v18 or higher)
- Python 3.7+ (for Whisper transcription)
- FFmpeg (for audio processing)

### Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Whisper (for transcription)
pip install openai-whisper

# Install FFmpeg (Ubuntu/Debian)
sudo apt update && sudo apt install ffmpeg

# Install FFmpeg (macOS)
brew install ffmpeg
```

### Build from Source

```bash
git clone https://github.com/username/podcast-manager.git
cd podcast-manager
npm install
npm run build
npm link  # Makes 'podcast-manager' available globally
```

## 📁 Project Structure

```
podcast-manager/
├── src/
│   ├── commands/           # CLI commands
│   │   ├── download.ts    # Download functionality
│   │   ├── list.ts        # List episodes
│   │   └── transcribe.ts  # Whisper integration
│   └── index.ts           # Main CLI entry point
├── downloads/             # Default download directory
├── transcripts/           # Default transcription output
└── dist/                  # Compiled JavaScript
```

## 🔧 Development

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

## 📊 Examples

### Download Latest Episodes
```bash
# Single latest episode
podcast-manager download --rss "https://feeds.example.com/podcast" --latest 1

# Latest 5 episodes
podcast-manager download --rss "https://feeds.example.com/podcast" --latest 5
```

### Download Specific Episode
```bash
podcast-manager download --rss "https://feeds.example.com/podcast" --episode 142
```

### Batch Transcription
```bash
# Transcribe all MP3 files in downloads folder
podcast-manager transcribe --input ./downloads --output ./transcripts
```

### Pipeline: Download + Transcribe
```bash
# Download latest episode
podcast-manager tid-er-penger --latest 1

# Transcribe downloaded files
podcast-manager transcribe --input ./downloads --output ./transcripts
```

## 🎯 Supported Formats

### Audio Formats
- MP3, WAV, M4A, MP4, AAC, FLAC

### Output Formats
- **Downloads**: MP3 (preserved original format)
- **Transcriptions**: SRT subtitle files

## ⚙️ Configuration

### Custom Download Directory
```bash
podcast-manager download --rss "..." --output "./my-podcasts"
```

### Transcription Languages
The tool auto-detects Norwegian by default, but Whisper supports 50+ languages.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) for transcription
- [rss-parser](https://github.com/rbren/rss-parser) for RSS feed parsing
- [Commander.js](https://github.com/tj/commander.js) for CLI framework

## 🐛 Issues & Support

Please [open an issue](https://github.com/username/podcast-manager/issues) for bug reports or feature requests.

---

**Made with ❤️ for podcast enthusiasts**
