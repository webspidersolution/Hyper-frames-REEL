# Write the platform logos used in the film as unmodified SVG files. Run from the project root:
#   python -I tools/extract_logos.py <path to @iconify-json/logos package>/icons.json
# Source: the "SVG Logos" set by Gil Barbara (github.com/gilbarbara/logos), CC0-1.0, shipped on npm as @iconify-json/logos.
# The marks are trademarks of their owners; they are used as-is (no recolouring, no edits) to name the platforms WSS manages.
import json, os, sys

WANT = {   # file name in assets/logos/ : icon name in the set
    'google': 'google-icon', 'google-ads': 'google-ads', 'google-analytics': 'google-analytics',
    'google-search-console': 'google-search-console', 'meta': 'meta-icon', 'instagram': 'instagram-icon',
    'whatsapp': 'whatsapp-icon', 'wordpress': 'wordpress-icon', 'youtube': 'youtube-icon',
    'gemini': 'google-gemini-icon', 'chatgpt': 'openai-icon', 'perplexity': 'perplexity-icon',
}
data = json.load(open(sys.argv[1], encoding='utf-8'))
icons, aliases = data['icons'], data.get('aliases', {})
W0, H0 = data.get('width', 16), data.get('height', 16)
os.makedirs('assets/logos', exist_ok=True)
for out, name in WANT.items():
    src = icons.get(name) or icons.get(aliases.get(name, {}).get('parent', ''))
    if not src: raise SystemExit(f'missing icon {name}')
    w, h = src.get('width', W0), src.get('height', H0)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{src["body"]}</svg>\n'
    open(f'assets/logos/{out}.svg', 'w', encoding='utf-8').write(svg)
    print(f'{out:24s} <- logos:{name}  {w}x{h}')
open('assets/logos/SOURCE.md', 'w', encoding='utf-8').write(
    '# Platform logos\n\nFrom "SVG Logos" by Gil Barbara (https://github.com/gilbarbara/logos), CC0-1.0, via the npm package '
    '`@iconify-json/logos`. Extracted unmodified by `tools/extract_logos.py`.\n\nThe marks are trademarks of their owners '
    '(Google, Meta, WhatsApp, Automattic/WordPress, YouTube, OpenAI, Perplexity). They are used only to name the platforms '
    'Web Spider Solutions works with; check each owner\'s brand guidelines before publishing, and don\'t imply a partnership '
    'that does not exist. Amazon and Google Business Profile marks are not in this set: drop official files in as '
    '`amazon-ads.svg` / `google-business-profile.svg` to use them.\n\n' +
    ''.join(f'- `{o}.svg` ← `logos:{n}`\n' for o, n in WANT.items()))
