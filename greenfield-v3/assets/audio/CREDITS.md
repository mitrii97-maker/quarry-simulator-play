# Recorded quarry audio

All included source recordings were published under **CC0 1.0 Universal** on the linked Freesound pages when retrieved on 2026-11-01. Attribution is provided for provenance even though CC0 does not require it. The CC0 statement is linked from each source page; this package does not claim authorship of the recordings.

| Layer | Recording / author | Source |
| --- | --- | --- |
| `engine-idle` | Động Cơ Xe Cần Cẩu - Excavator Engine — SieuAmThanh | [770430](https://freesound.org/people/SieuAmThanh/sounds/770430/) |
| `engine-load` | Excavator 4.wav — eZZin | [606943](https://freesound.org/people/eZZin/sounds/606943/) |
| `hydraulic` | hydraulics.wav — nuckan | [212941](https://freesound.org/people/nuckan/sounds/212941/) |
| `rock-contact` | Crackling — Rock Movement — IESP | [337702](https://freesound.org/people/IESP/sounds/337702/) |
| `rock-fall` | Bricks/Stones/Rocks/Gravel Falling — iwanPlays | [567249](https://freesound.org/people/iwanPlays/sounds/567249/) |
| `metal-scrape` | Metal Pipe Scraped on Concrete in Basement.aif — RutgerMuller | [104361](https://freesound.org/people/RutgerMuller/sounds/104361/) |

Licence: https://creativecommons.org/publicdomain/zero/1.0/

`engine-idle` is a steady excerpt of a real excavator recording chosen for the base idle layer; the source does not label its exact RPM. `engine-load` is a working excavator recording and also contains some excavation noise. `hydraulic` is a real forklift hydraulic recording; `metal-scrape` is real metal-on-concrete foley. These details are intentional and must not be misrepresented as separately measured stems from the same excavator. The falling-rock mix credits its component CC0 recordings on the source page.

Processing: selected excerpts, mono 32 kHz, highpass filtering, loudness normalization and a 200 ms equal-power wrap splice for looping layers. Engine WAV files avoid codec priming; MP3 alternatives and the other layers use 96 kbps. Rock-fall is a non-looping event with short fades. Loading software should use smooth gain envelopes; overlapping loop voices are optional extra seam protection. Metadata and exact file durations/checksums are in `sources.json`.

All files were technically decoded and checked for finite non-silent samples. **No manual listening/audition was possible with the available tools**, so subjective mix quality still needs headphone/device validation. No synthetic engine hum was generated.
