---
title: "Writeup: The Riddler's Frequency"
published: 2026-05-12
description: A CTF steganography writeup about recovering a hidden flag from phase relationships between audio segments.
image: ./images/ctf1.jpg
tags: [CTF, Steganography, Audio, Phase Coding]
category: Writeups
draft: false
pinned: false
---

This writeup covers **The Riddler's Frequency**, a steganography challenge built around audio phase coding.

The challenge gives us a single audio file named `riddlers_broadcast_1024.flac`. At first it sounds like pure white noise, but the important clue is not in what we hear. It is in the relationship between the audio segments.

## Challenge Info

```text
Category: Steganography
Points: 500
```

Flavor text:

> "I've been broadcasting on all frequencies, but none of you are listening correctly. It's not what you hear. It's the relationship between what you hear ... specifically, between each piece." — E. Nygma

## Recon

First, we run basic recon on the file:

```bash
exiftool riddlers_broadcast_1024.flac
ffprobe riddlers_broadcast_1024.flac
```

Nothing interesting appears in the metadata.

Opening the file in Audacity shows that it sounds like pure white noise. Checking the spectrogram with different FFT sizes and color schemes also gives us nothing useful.

The spectrogram path is a dead end.

## Reading the Flavor Text

Going back to the description, the wording is very direct:

- `"Not what you hear"` eliminates amplitude-based techniques like LSB and spectrogram analysis.
- `"Relationship between what you hear"` points to something comparative between parts of the audio.
- `"Specifically, between each piece"` suggests the audio is divided into pieces or segments.

Searching for `audio steganography phase segments` leads to **phase coding steganography**.

In phase coding, the audio is split into segments, a DFT is applied to each segment, and the hidden message is encoded into the **phase of the first segment** while preserving the phase differences between the other segments.

The filename gives us the segment length directly:

```text
riddlers_broadcast_1024.flac
```

So the segment length is **1024**.

## Solving

We convert the FLAC to WAV first, because the decoder works on raw samples:

```bash
ffmpeg -i riddlers_broadcast_1024.flac riddlers_broadcast.wav
```

Then we write a small decoder that reads the phase values from the first segment.

## Solver Script

```python
import numpy as np
import soundfile as sf


def phase_decode(audio, segment_length=1024, max_chars=64):
    num_segments = len(audio) // segment_length
    audio_segments = audio[:num_segments * segment_length].reshape(
        num_segments, segment_length
    )

    # DFT each segment
    dft_segments = np.fft.fft(audio_segments, axis=1)
    phases = np.angle(dft_segments)

    # Cap to available bins
    num_bits = min(max_chars * 8, segment_length)

    # Read phase of first segment
    # Start from index 1 to skip bin 0, the DC component
    bits = []
    for i in range(num_bits):
        if phases[0][i + 1] < 0:
            bits.append("0")
        else:
            bits.append("1")

    # Convert bits to characters
    chars = []
    for i in range(0, len(bits), 8):
        byte = "".join(bits[i:i + 8])
        char = chr(int(byte, 2))
        if char == "\x00":
            break
        chars.append(char)

    return "".join(chars)


audio, sr = sf.read("riddlers_broadcast.wav")
message = phase_decode(audio)
print(f"[+] Flag: {message}")
```

## Output

```text
[+] Flag: CTF{r1ddl3r_kn0ws_th3_fr3qu3ncy}
```

## Key Takeaways

- Spectrogram is the natural first instinct for audio steganography, but knowing when to abandon it is half the challenge.
- The flavor text is a direct logical clue, not a vague riddle.
- `"Relationship between each piece"` maps cleanly to phase relationships between audio segments.
- The filename hints at the segment length, `1024`, removing the only trial-and-error part of the solve.
- Phase coding is rare in CTFs because common GUI tools do not solve it automatically. You have to understand the technique well enough to implement the decoder yourself.
