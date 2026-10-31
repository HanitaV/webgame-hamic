# V3 source-sync verification

Display-name correction: caption text now reads `HAMIC trình làng Đêm Toán Tin`.
The vertical and horizontal burned-caption masters and 720p preview were rebuilt;
source voice and cue timestamps stay unchanged. The clean master has no spoken
caption text to replace. Evidence: `hamic-text-render.log` and the brand stills.

## Change

The previous pipeline cut the new MP3 using timestamps and text from an older script. The current pipeline keeps the complete source at 1x from time zero and maps the animation choreography to that timebase. Caption text now follows the user-provided script.

Source: `ElevenLabs_2026-10-31T16_19_32_Phan Hưng - Professional & Clear_pvc_sp100_s50_sb75_v4.mp3` (60.604063s). Output: 60.666667s, 1820 frames, 30 fps. No speech speed changes or clause splicing.

## Checks performed

- `npm run check`: 1239 answer checks passed; no missing translation keys; casual-copy lint 0 violations.
- `npm run build`: passed. Existing bundle-size warning remains.
- `npm run capture -- ../trailer_v3/qa/game-captures phone`: passed, `ERRORS []`; viewed the 844×390 title capture.
- Gate A: inspected 24 source-frame stills including all eight tasks, countdown, both explosions, simulation relief, announcement and CTA.
- Inspected the final vertical video contact sheet for captions, scene content and clipping.
- FFprobe: all three synced masters have 1820 video frames and matching audio/video duration 60.666667s. See `sync-media-report.json`.
- 48 phrase cues: positive duration, ordered, no overlaps, no cues beyond video end. Sidecar and renderer data share the same generated source.

## Rendering

Three.js: hardware NVIDIA RTX 3060 Laptop GPU / ANGLE D3D11. FFmpeg: CUDA decode verified. The installed driver 527.99 exposes NVENC API 12.0; this FFmpeg build requests API 13.1. Encoding therefore uses the explicitly reported libx264 fallback. Logs are in `sync-render-a.log`, `sync-render-b.log`, `sync-render-c.log`.

## Timing precision and limits

Caption boundaries follow detected source pauses, using the supplied script. They are phrase cues, not verified ASR word timestamps, and no karaoke word timing is fabricated. Final review used source silence boundaries, timeline telemetry, media probes and visual inspection; it did not include an independent listening/transcription pass. Sidecar cue resolution is milliseconds; scene changes are sampled at 30 fps.

The source voice is mixed with ducked background music. The previous SFX track was not reused because its effects were timed to the obsolete cut. Old 59s masters and older QA proof grids remain for comparison; use the `synced` masters and the current logs/contact sheet.
