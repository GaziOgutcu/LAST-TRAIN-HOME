# Last Train Home — Web Demo

A GitHub/Vercel-ready React prototype for **Last Train Home**, a psychological horror passenger-inspection game.

## What is included

- Station progression across 8 stops
- Passenger inspection loop: inspect, question, allow, deny
- Anomaly system with subtle and obvious tells
- Hidden stress system represented by visual distortion, flicker, status text, and UI pressure
- Three ending states: survived, collapse, anomaly truth
- Local best-run stats via `localStorage`
- No paid assets, no backend, no API keys

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New Project**.
3. Import the GitHub repo.
4. Vercel should detect Vite automatically.
5. Build command: `npm run build`
6. Output directory: `dist`

## Gameplay

- Click a passenger to inspect them.
- Read their ticket, visible behaviour, and reflection clue.
- Use **Question** when unsure.
- Use **Allow** for normal passengers.
- Use **Deny** for anomalies.
- Wrong choices raise stress. High stress makes the interface unreliable.

## Suggested next upgrades

- Add WebAudio ambience and heartbeat layers.
- Replace CSS passengers with 2D character art or lightweight 3D.
- Add route randomization and daily seed sharing.
- Add streamer mode with visible final stats and share card.
