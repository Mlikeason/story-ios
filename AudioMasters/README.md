# Story · listening masters

The files here are the unmodified inputs for Margaret River, Afternoon Classroom and Sleepless Rain Night. This directory is outside the application bundle. Run `sh Tools/master-audio.sh` on macOS with FFmpeg and access to Apple's AudioToolbox encoder to rebuild the three listening copies in Resources. The other three original MP3s are unchanged in Resources.

The two quiet recordings use fixed gain and a stereo-linked look-ahead peak limiter, without noise gates, adaptive background levelling, added ambience or trimming the timeline. The other recordings need only fixed playback trims from `Resources/recordings.json`. The native player and web preview apply the same track trims.

Sleepless Rain Night uses compression only: Apple AAC-LC, highest encoder quality, 192 kbps average bitrate target, 44.1 kHz and two channels. No filters or edits are applied. The original 96,398,862-byte MP3 is preserved as `02rain0404.mp3` (SHA-256 `052dcdd9fcba628858d02691fd96c449583a46dd6046294c9f8a05037a7093df`). The 54,892,087-byte listening copy is `Resources/02-rain-night.m4a`. Both last about 50:12; AAC container padding adds about 12 ms. Measured integrated loudness changes from −21.6 to −21.7 LUFS before the unchanged −2.5 dB playback trim, while loudness range remains 4.5 LU. AAC is lossy; these measurements do not substitute for listening approval.

Measured full-program integrated loudness in LUFS, including track trim but excluding the common 0.85 playback volume:

| Recording | Before | Listening copy |
| --- | ---: | ---: |
| Margaret River | −42.9 | −27.0 |
| Sleepless Rain Night | −21.6 | −24.2 |
| Afternoon Classroom | −39.7 | −27.5 |
| Tepid Wind | −20.7 | −24.7 |
| Morning After Rain | −23.9 | −24.9 |
| Armani @ Burj Khalifa | −21.8 | −24.8 |

The grove keeps 16.4 LU of measured loudness range. Final subjective approval is by listening on the user's devices.
