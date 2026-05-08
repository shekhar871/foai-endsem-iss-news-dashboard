## Real‑Time ISS & News Dashboard

Web dashboard that:

- Tracks the **ISS live** (15s polling) on a Leaflet map with **15‑point trajectory**, **Haversine speed** (km/h), and **nearest place** (reverse geocode)
- Shows **Breaking News** (Science + Technology) with **search**, **sort**, **per-category refresh**, and **15‑minute localStorage cache**
- Includes an **AI chatbot** that answers **only from dashboard data** (ISS + loaded news) using Hugging Face **`mistralai/Mistral-7B-Instruct-v0.2`**
- Visualizes data with **3 interactive visuals**:
  - ISS map (Leaflet)
  - ISS speed trend (Chart.js line chart, last 30)
  - News distribution (Chart.js doughnut; click slice to filter)

### Environment variables

Create `.env` (do not commit it):

```bash
VITE_NEWS_API_KEY=your_newsapi_key_here
VITE_AI_TOKEN=your_huggingface_token_here
```

You can copy from `.env.example`.

### Run locally

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Deployment (Vercel)

In Vercel project settings, add:

```bash
VITE_NEWS_API_KEY=...
VITE_AI_TOKEN=...
```

CLI (optional):

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

### Assignment question (LLM)

**Model used**: Hugging Face `mistralai/Mistral-7B-Instruct-v0.2`

**Why**: It’s a strong instruction-following model and works well with a strict “answer only from provided context JSON” prompt, which is exactly what the dashboard chatbot requires.