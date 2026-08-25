# Clone

Local voice cloning studio. Native GPU UI via [GPUIX](https://github.com/remorses/gpuix). Synthesis via [VoxCPM2](https://github.com/OpenBMB/VoxCPM) through `voxcpm2-cli` from llama.cpp-omni.

## Run

```bash
bun install
bun run dev
```

Record a voice from Harvard sentences, then type text and generate speech in that voice.

Voices and generations live in `~/.voice-clone`. Model paths default to files under `/Users/yanicells/Documents/dev/local-models`.
