# Dashboard – Hospital São Rafael
## Stack: Vite + React + Tailwind CSS + Recharts

### Setup (uma vez só)

```bash
npm create vite@latest dashboard -- --template react
cd dashboard
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install recharts lucide-react axios
```

### Configurar Tailwind

Substitua o conteúdo de **tailwind.config.js** por:

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Substitua o conteúdo de **src/index.css** por:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Copiar os arquivos

Copie todos os arquivos `.jsx` e `.js` para dentro de **src/**.
A estrutura final deve ser:

```
dashboard/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── api.js               ← cliente HTTP para a FastAPI
│   └── components/
│       ├── KpiCard.jsx
│       ├── FunilLeads.jsx
│       ├── LeadsCanal.jsx
│       ├── AgendamentosChart.jsx
│       ├── TabelaLeads.jsx
│       ├── TabelaAgendamentos.jsx
│       └── AlertasSac.jsx
├── index.html
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

### Rodar

```bash
# Terminal 1 — API Python
uvicorn api:app --reload --port 8000

# Terminal 2 — Dashboard React
cd dashboard
npm run dev
# Acesse: http://localhost:5173
```
