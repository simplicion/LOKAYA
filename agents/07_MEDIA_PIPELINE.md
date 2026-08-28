# MEDIA PROCESSING — R2 + CDN + FFMPEG + HLS

## 1. Goals
Reliable uploads, fast playback, adaptive delivery, low storage/egress waste.

## 2. Upload Architecture
```text
Browser
  ↓
POST /media/upload-session
  ↓
API auth + ownership check
  ↓
Signed/direct-upload credentials
  ↓
Browser → R2
  ↓
POST /media/complete
  ↓
MediaAsset created
  ↓
Queue
  ↓
Worker
```

## 3. Images
Validate:
- MIME
- magic bytes
- dimensions
- size

Generate:
- thumbnail
- small
- medium
- large
- optional original

Prefer WebP/AVIF where supported.

## 4. Video
```text
UPLOAD
 ↓
VALIDATE
 ↓
PROBE
 ↓
QUEUE
 ↓
FFMPEG TRANSCODE
 ↓
HLS MANIFEST + SEGMENTS
 ↓
POSTER/THUMBNAIL
 ↓
READY
 ↓
CDN
```

## 5. HLS
Use adaptive bitrate renditions.

Start with a measured ladder rather than hardcoding excessive resolutions. Example conceptual tiers:
- low bandwidth mobile
- standard mobile
- high mobile
- desktop/high quality

Segment duration target: approximately 2–6 seconds, then benchmark startup/overhead.

## 6. Worker Requirements
Workers must be:
- idempotent
- bounded in CPU/memory
- retry-safe
- observable
- cancellable where practical

Store job state.

## 7. Media State Machine
UPLOADED → PROCESSING → READY
PROCESSING → FAILED
READY → DELETING → DELETED

Content requiring processed media must not publish before required variants are READY.

## 8. Object Key Strategy
Use immutable, generated object keys.

Never trust user-provided filenames as storage paths.

Example conceptual:
media/{assetId}/original
media/{assetId}/images/medium.webp
media/{assetId}/video/master.m3u8
media/{assetId}/video/720p/segment-00001.ts

## 9. CDN
CDN serves processed objects.

Immutable/versioned objects should receive long cache TTL.

Private objects should use signed URLs/tokens where required.

## 10. Security
Protect against:
- path traversal
- malicious file types
- decompression bombs
- oversized media
- huge video duration
- codec abuse
- zip/bomb-like resource exhaustion
- unbounded FFmpeg processes

## 11. Cleanup
Schedule:
- abandoned upload cleanup
- failed temporary artifact cleanup
- orphan object detection
- expired reservation-related media where applicable

Never delete media still referenced by live content.
