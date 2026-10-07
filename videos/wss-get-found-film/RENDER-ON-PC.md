# Rendering on your PC

The cloud box has no GPU, so its drafts use software WebGL (fine for this film: ~2 minutes for the 30 fps draft).
For the final, render on your PC; the GPU path is faster and gives the same pixels.

## Once: get the project
```powershell
git clone https://github.com/webspidersolution/Hyper-frames-REEL.git   # or, in an existing clone: git pull
cd Hyper-frames-REEL
git checkout claude/intelligent-lamport-xw402m
cd videos/wss-get-found-film
```
You need Node.js 22+ and ffmpeg on PATH. Check with `npx hyperframes@0.8.140 doctor`; if it reports no Chrome, run
`npx hyperframes@0.8.140 browser ensure`.

## Every render
```powershell
node tools/build.mjs        # regenerates index.html from src/ (props, fonts, logos, audio)
npx hyperframes@0.8.140 render --fps 30 --gpu --browser-gpu -o "$PWD\renders\wss_get_found_16x9.mp4"
```
- The film is authored at 30 fps (the reference's rate). `--fps 60` also works: every move is a pure function of time.
- If the GPU path fails the CLI says so; re-run with `--no-browser-gpu` (software WebGL, slower, same pixels).

## Check the output
```powershell
python tools/review.py renders/wss_get_found_16x9.mp4    # frame sheet + loudness (needs Python + Pillow)
```
Expect 35.0 s, 1920×1080, about −14 LUFS. The audio is the committed `assets/audio/mix.wav`, so no Python is needed
just to render.

## If you change the sound
The Python tools need `pip install numpy scipy soundfile pillow`:
```powershell
python tools/vo.py; python tools/score.py; python tools/sfx.py; python tools/mix.py; node tools/build.mjs
```
`tools/sfx.py` reads your `D:\Hyperframes\sfx` library (set `HYPERREEL_SFX_LIB` if it lives elsewhere).
