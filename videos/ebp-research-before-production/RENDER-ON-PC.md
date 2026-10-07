# Final renders (60 fps) on your GPU PC

The cloud box has no GPU, so the drafts there were rendered with software WebGL at 30 fps. The finals render on your
PC with the GPU: about 5–10 minutes per format on an RTX card.

## Once: get the project
```powershell
git clone https://github.com/webspidersolution/Hyper-frames-REEL.git   # or, in an existing clone: git pull
cd Hyper-frames-REEL
git checkout claude/zealous-wright-jhhan4
cd videos/ebp-research-before-production
```
You need Node.js 22+ and ffmpeg on PATH. Check with `npx hyperframes@0.8.139 doctor`. If it reports no Chrome, run
`npx hyperframes@0.8.139 browser ensure`.

## Every render
```powershell
node tools/build.mjs        # regenerates index.html + 16x9/index.html and the 16x9\assets junction
npx hyperframes@0.8.139 render --fps 60 --gpu --browser-gpu -o "$PWD\renders\ebp_research_first_9x16.mp4"
npx hyperframes@0.8.139 render 16x9 --fps 60 --gpu --browser-gpu -o "$PWD\renders\ebp_research_first_16x9.mp4"
```
- Run `node tools/build.mjs` first. The `16x9\assets` junction isn't in git, and the 16:9 render needs it.
- Use the full output path for the 16:9 render, as above.
- If the GPU path fails, the CLI says so. Re-run with `--no-browser-gpu` to use software WebGL, which is slower but
  gives the same pixels.
- Read the summary's second line: `beginframe` + `hardware gpu` is the fast path.

## Check the output
```powershell
python tools/review.py renders/ebp_research_first_9x16.mp4    # frame sheet + loudness (needs Python + Pillow)
```
Expect 50.0 s, 1080×1920 / 1920×1080 at 60 fps, and about -14 LUFS. The audio is the committed
`assets/audio/mix.wav`, so no Python is needed just to render.

## If you change the sound
The Python tools need `pip install numpy scipy soundfile pillow`:
```powershell
python tools/vo.py; node tools/export_events.mjs; python tools/score.py; python tools/sfx.py; python tools/mix.py; node tools/build.mjs
```
On your PC, `tools/sfx.py` reads your `D:\Hyperframes\sfx` library (HYPERREEL_SFX_LIB) before the bundled Pixabay
one-shots.
