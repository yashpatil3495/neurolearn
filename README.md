# 🧠 NeuroLearn

An **emotion-aware adaptive learning platform** that detects a student's mood via webcam and uses Claude AI to rewrite lesson content in real time.

---

## ✨ Features

- 📷 **Live emotion detection** via face-api.js (runs fully in-browser, no server needed for detection)
- 🤖 **Claude-powered content adaptation** — lesson text rewrites every 3 seconds based on detected mood
- 📊 **Teacher dashboard** with emotion frequency chart and session timeline
- 💾 Session history stored in localStorage (no database needed)

## 🗂 Project Structure

```
neurolearn/
├── index.html        ← Student lesson page
├── dashboard.html    ← Teacher dashboard
├── style.css         ← All styles
├── app.js            ← Webcam + emotion detection + UI
├── dashboard.js      ← Chart + timeline rendering
├── server.js         ← Express + Claude API proxy
├── vercel.json       ← Vercel deployment config
├── package.json
└── lessons/
    ├── math.json
    └── science.json
```

---

## 🚀 Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Add your Claude API key
echo "CLAUDE_API_KEY=your_key_here" > .env

# 3. Start the server
node server.js

# 4. Open in browser
open http://localhost:3000
```

Get a Claude API key at [console.anthropic.com](https://console.anthropic.com).

---

## ☁️ Deploy to Vercel

### Option A — Via GitHub (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. In **Environment Variables**, add:
   - Key: `CLAUDE_API_KEY`
   - Value: your key from [console.anthropic.com](https://console.anthropic.com)
4. Click **Deploy**

### Option B — Via Vercel CLI (no GitHub needed)

```bash
npm install -g vercel
vercel
vercel env add CLAUDE_API_KEY
vercel --prod
```

---

## 🎭 Emotion → Adaptation Logic

| Detected Mood | What Claude Does |
|---|---|
| 😊 Focused | Adds advanced insight or challenge question |
| 😵 Confused | Simplifies with a real-world analogy |
| 😴 Bored | Adds a fun fact or quick quiz |
| 😤 Frustrated | Suggests a mental break, re-explains gently |

---

## 🛠 Tech Stack

- **Frontend** — Plain HTML, CSS, Vanilla JS
- **Emotion AI** — [face-api.js](https://github.com/justadudewhohacks/face-api.js) (CDN)
- **Content AI** — Claude API (`claude-sonnet-4-20250514`)
- **Backend** — Node.js + Express
- **Deploy** — Vercel-ready

---

## ⚠️ Notes

- Webcam access is required for emotion detection
- face-api.js model weights load from CDN on first use (~5–10 seconds)
- API key is never exposed to the browser — all Claude calls go through the Express backend
