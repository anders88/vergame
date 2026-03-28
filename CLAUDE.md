# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step required. Open `index.html` directly in a browser:

```bash
open index.html
```

For development with live reload, any static file server works:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Architecture

This is a single-page vanilla JS browser game called "Synstrening" (Norwegian: sight training). Three files, no dependencies, no bundler.

- `index.html` — Game UI: start screen, HUD (score/level/timer), game area, game-over screen
- `game.js` — All game logic (~241 lines)
- `style.css` — Styling, dark theme, CSS animations (pop, rise, bump)

### game.js structure

- **Config object** (top of file): all tunable values — game duration (60s), 10 level definitions (spawn interval, speed, square size, max concurrent squares), color palette
- **Game state**: squares array, score, level, time remaining, RAF id
- **`startGame()`**: resets state, starts the RAF loop and spawn timer
- **`gameLoop()`**: RAF-driven, handles time tracking, level progression (every 80 points), square movement, off-screen removal
- **`spawnSquare()`**: spawns from a random edge with random color/size/speed
- **`onGameAreaClick()`**: calculates reaction bonus (0–10 extra points within 500ms of spawn), shows floating score popup
- **`updateHUD()`**: syncs DOM to current score/level/time

### Difficulty scaling

Level 1→10 increases difficulty: spawn interval 2000ms→500ms, speed 120→390 px/s, size 60→30px, max concurrent squares 4→10. Level advances when `score >= currentLevel * 80`.
