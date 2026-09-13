# Clone

Local voice cloning studio. Native GPU UI via [GPUIX](https://github.com/remorses/gpuix). Synthesis via VoxCPM2 (`voxcpm2-cli` from llama.cpp-omni).

## Run

```bash
bun install
bun run dev
```

Hot reload remounts React in the same window. Close the red traffic light to quit.

## Use

1. **Voices → Record** — name the voice, pick Quick (3 Harvard sentences) or Full (40, about two minutes), then read each line.
2. **Speak** — select a voice, type, Enter. Clone uses your reference. Design describes a voice in parentheses with no clip.
3. Import a WAV if you already have a clean recording.

Voices and generations are stored in `~/.voice-clone`. Model paths default to files under `/Users/yanicells/Documents/dev/local-models`.
