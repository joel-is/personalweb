# Joel Shapiro Personal Site

A pixel-art, 32-bit Pokemon-themed personal site. Static HTML, CSS, and a sprinkle of vanilla JavaScript. No build step, no dependencies.

## File structure

```
.
├── index.html       # Page markup
├── style.css        # All styling
├── script.js        # Typewriter dialog, stat-bar animation, Konami easter egg
├── assets/
│   └── resume.pdf 
├── LICENSE
└── README.md
```

## Local preview

Just open `index.html` in any browser. For a slightly better experience (some browsers block `file://` for fonts), serve it locally:

```
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Adding your resume

The "Download Resume" button links to `assets/resume.pdf`. Create the folder and drop your PDF in:

```
mkdir assets
cp ~/Documents/<resume>.pdf assets/resume.pdf
```

## Sprite assets

The trainer and Ampharos sprites are hot-linked from `play.pokemonshowdown.com` and `img.pokemondb.net`. They render fine, but if you want to bulletproof against the CDNs going down, save local copies into `assets/` and update the two `img src` paths in `index.html`.

## Easter eggs

- The Pokedex Entry types itself out when it scrolls into view.
- Stat bars fill in when the Interests section comes into view.
- The Konami code (Up Up Down Down Left Right Left Right B A) makes Ampharos glow.

## Editing notes

- All colors live in CSS variables at the top of `style.css` under `:root`.
- The "Joel's Trainer Card" title is in `index.html` inside `.title-bar h1`.
- Social links are in the `<section id="connect">` block.
- The site is fully responsive and respects `prefers-reduced-motion`.
