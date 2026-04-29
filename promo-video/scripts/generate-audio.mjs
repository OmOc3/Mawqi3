import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outPath = join(root, "public", "audio", "ecopest-bed.wav");
const sampleRate = 48000;
const seconds = 45;
const channels = 2;
const samples = sampleRate * seconds;
const bytesPerSample = 2;
const dataSize = samples * channels * bytesPerSample;
const buffer = Buffer.alloc(44 + dataSize);

function writeString(offset, value) {
  buffer.write(value, offset, value.length, "ascii");
}

writeString(0, "RIFF");
buffer.writeUInt32LE(36 + dataSize, 4);
writeString(8, "WAVE");
writeString(12, "fmt ");
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(channels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
buffer.writeUInt16LE(channels * bytesPerSample, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34);
writeString(36, "data");
buffer.writeUInt32LE(dataSize, 40);

const chords = [
  [146.83, 220, 293.66],
  [164.81, 246.94, 329.63],
  [130.81, 196, 261.63],
  [174.61, 220, 349.23],
];

function envelope(time) {
  const fadeIn = Math.min(1, time / 2.5);
  const fadeOut = Math.min(1, (seconds - time) / 3);
  const pulse = 0.82 + 0.18 * Math.sin(2 * Math.PI * 0.5 * time);

  return Math.max(0, Math.min(fadeIn, fadeOut)) * pulse;
}

for (let index = 0; index < samples; index += 1) {
  const time = index / sampleRate;
  const chord = chords[Math.floor(time / 6) % chords.length];
  const lead = [440, 493.88, 392, 523.25][Math.floor(time / 3) % 4];
  const pad = chord.reduce((sum, frequency) => sum + Math.sin(2 * Math.PI * frequency * time), 0) / chord.length;
  const bell = Math.sin(2 * Math.PI * lead * time) * Math.max(0, 1 - (time % 3) / 3);
  const beat = Math.sin(2 * Math.PI * 58 * time) * (time % 1 < 0.11 ? 1 : 0);
  const value = (pad * 0.23 + bell * 0.08 + beat * 0.1) * envelope(time);
  const sample = Math.max(-1, Math.min(1, value));
  const left = Math.round(sample * 0.82 * 32767);
  const right = Math.round(sample * 0.76 * 32767);
  const offset = 44 + index * channels * bytesPerSample;

  buffer.writeInt16LE(left, offset);
  buffer.writeInt16LE(right, offset + 2);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, buffer);
console.warn(`Generated ${outPath}`);
