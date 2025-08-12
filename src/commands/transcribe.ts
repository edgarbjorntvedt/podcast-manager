import { spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import chalk from 'chalk';

interface TranscribeOptions {
  input?: string;
  output?: string;
}

export async function transcribeCommand(options: TranscribeOptions) {
  try {
    if (!options.input) {
      console.error(chalk.red('❌ Input fil eller mappe er påkrevd'));
      console.log(chalk.gray('Bruk: podcast-manager transcribe -i <path>'));
      process.exit(1);
    }

    const outputDir = options.output || './transcripts';
    mkdirSync(outputDir, { recursive: true });

    console.log(chalk.blue('🎤 Starter transkribering...'));

    // Check if Whisper is available
    const whisperAvailable = await checkWhisperInstallation();
    if (!whisperAvailable) {
      console.error(chalk.red('❌ Whisper ikke funnet!'));
      console.log(chalk.yellow('Installer Whisper med: pip install openai-whisper'));
      process.exit(1);
    }

    const audioFiles = await findAudioFiles(options.input);
    
    if (audioFiles.length === 0) {
      console.error(chalk.red('❌ Ingen lydfiler funnet'));
      process.exit(1);
    }

    console.log(chalk.green(`📁 Funnet ${audioFiles.length} lydfiler`));

    for (const audioFile of audioFiles) {
      await transcribeFile(audioFile, outputDir);
    }

    console.log(chalk.green('✅ Transkribering fullført!'));

  } catch (error) {
    console.error(chalk.red('❌ Feil ved transkribering:'), error);
    process.exit(1);
  }
}

async function checkWhisperInstallation(): Promise<boolean> {
  return new Promise((resolve) => {
    const whisper = spawn('whisper', ['--help'], { stdio: 'ignore' });
    whisper.on('close', (code) => {
      resolve(code === 0);
    });
    whisper.on('error', () => {
      resolve(false);
    });
  });
}

async function findAudioFiles(inputPath: string): Promise<string[]> {
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.flac'];
  const audioFiles: string[] = [];

  if (!existsSync(inputPath)) {
    throw new Error(`Path does not exist: ${inputPath}`);
  }

  const stat = statSync(inputPath);
  
  if (stat.isFile()) {
    // Single file
    if (audioExtensions.includes(extname(inputPath).toLowerCase())) {
      audioFiles.push(inputPath);
    }
  } else if (stat.isDirectory()) {
    // Directory - scan for audio files
    const files = readdirSync(inputPath);
    for (const file of files) {
      const filePath = join(inputPath, file);
      if (audioExtensions.includes(extname(file).toLowerCase())) {
        audioFiles.push(filePath);
      }
    }
  }

  return audioFiles;
}

async function transcribeFile(audioFile: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const filename = basename(audioFile, extname(audioFile));
    const outputFile = join(outputDir, `${filename}.srt`);

    console.log(chalk.blue(`🎵 Transkriberer: ${basename(audioFile)}`));
    console.log(chalk.gray(`   Output: ${outputFile}`));

    // Run Whisper with SRT output format
    const whisper = spawn('whisper', [
      audioFile,
      '--output_format', 'srt',
      '--output_dir', outputDir,
      '--language', 'Norwegian',
      '--model', 'base'
    ]);

    whisper.stdout.on('data', (data) => {
      process.stdout.write(chalk.gray(data.toString()));
    });

    whisper.stderr.on('data', (data) => {
      process.stderr.write(chalk.yellow(data.toString()));
    });

    whisper.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`   ✅ ${filename}.srt`));
        resolve();
      } else {
        reject(new Error(`Whisper exited with code ${code}`));
      }
    });

    whisper.on('error', (error) => {
      reject(error);
    });
  });
}
