# 🚀 GUÍA PASO A PASO — LinkedIn Trend Analyzer
## Para Lucas Vega (no necesitás saber programar)

---

## ✅ LO QUE YA HICISTE (bien hecho):
- [x] Supabase: tablas `analyses` y `generated_posts` creadas
- [x] Proyecto Supabase configurado

## 📋 LO QUE FALTA (30 minutos):

---

## PASO 1: Crear repositorio en GitHub (5 min)

1. Andá a **https://github.com/new**
2. Nombre: `linkedin-analyzer`
3. Dejalo **público** (o privado, como quieras)
4. Hacé click en **"Create repository"**
5. NO marques "Add README" ni nada, crealo vacío

---

## PASO 2: Subir el código (10 min)

### Opción A: Usando la terminal (más rápido)

Abrí la terminal de tu computadora y ejecutá estos comandos 
uno por uno:

```bash
# 1. Clonar el repo vacío
git clone https://github.com/TU-USUARIO/linkedin-analyzer.git
cd linkedin-analyzer

# 2. Descomprimir el ZIP que descargaste de Claude
# (copiá todos los archivos del ZIP a esta carpeta)

# 3. Subir a GitHub
git add .
git commit -m "LinkedIn Trend Analyzer v1.0"
git push origin main
```

### Opción B: Desde la web de GitHub (sin terminal)

1. En tu repo vacío, hacé click en **"uploading an existing file"**
2. Arrastrá TODOS los archivos del ZIP que descargaste
3. Click en **"Commit changes"**

⚠️ **IMPORTANTE**: Asegurate que la estructura quede así:
```
linkedin-analyzer/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.js
│   │   ├── hooks/
│   │   │   └── route.js
│   │   └── post/
│   │       └── route.js
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── lib/
│   ├── gemini.js
│   ├── perplexity.js
│   └── supabase.js
├── .env.local.example
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vercel.json
```

---

## PASO 3: Deploy en Vercel (5 min)

1. Andá a **https://vercel.com/new**
2. Si no tenés cuenta, registrate con tu GitHub
3. Hacé click en **"Import"** junto a `linkedin-analyzer`
4. En la sección **"Environment Variables"**, agregá estas 4:

| Variable | Valor |
|----------|-------|
| `GEMINI_API_KEY` | Tu key de https://aistudio.google.com |
| `PERPLEXITY_API_KEY` | Tu key de https://www.perplexity.ai/settings/api |
| `NEXT_PUBLIC_SUPABASE_URL` | La URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La anon key de tu proyecto Supabase |

5. Click en **"Deploy"**
6. Esperá 1-2 minutos
7. ¡Tu app está en vivo! 🎉

---

## PASO 4: Obtener las API Keys (si no las tenés)

### Gemini API Key (gratis):
1. Andá a https://aistudio.google.com
2. Click en "Get API Key" (menú izquierdo)
3. Click en "Create API Key"
4. Copiá la key

### Perplexity API Key (USD 5/mes incluidos con Pro):
1. Andá a https://www.perplexity.ai/settings/api
2. Click en "Generate" (o el botón para crear key)
3. Copiá la key
4. Tu plan Pro te da USD 5/mes de crédito automático

### Supabase URL y Key:
1. Andá a tu proyecto en https://supabase.com
2. Settings → API
3. Copiá:
   - **Project URL** → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## PASO 5: Verificar que funciona

1. Abrí tu app (el URL que te dio Vercel, tipo 
   linkedin-analyzer-xxx.vercel.app)
2. Escribí "LegalTech Argentina" en el buscador
3. Hacé click en "Analizar"
4. Deberías ver:
   - ⏳ Spinner "Buscando tendencias reales..."
   - 📊 5 tendencias con fuentes REALES (URLs clickeables)
   - 🎯 3 ángulos únicos
   - 🕳️ 2 content gaps
5. Hacé click en "Generar Hooks →" en cualquier tendencia
6. Vas a ver 6 hooks con fórmulas y ratings
7. Hacé click en "Escribir Post →" 
8. ¡Post completo con preview estilo LinkedIn!

---

## 🔧 SI ALGO FALLA:

### "Error 500" o "Error analizando"
→ Revisá las Environment Variables en Vercel 
→ Settings → Environment Variables
→ Asegurate que las 4 keys estén correctas
→ Hacé "Redeploy" después de cambiar algo

### "Perplexity error 401"
→ Tu API key de Perplexity es incorrecta
→ Regenerala en perplexity.ai/settings/api

### "Gemini JSON parse error"
→ Normal en primeros intentos, intentá de nuevo
→ Gemini a veces agrega texto extra al JSON

### "La página carga pero no hace nada"
→ Abrí DevTools (F12) → Console → mirá el error
→ Si dice "fetch failed", las API routes no funcionan
→ Verificá que el deploy fue exitoso en Vercel

### "Supabase error" 
→ No bloquea la app, solo el historial
→ Verificá URL y anon key en las env vars

---

## 📁 ARCHIVOS INCLUIDOS (13 archivos)

| Archivo | Qué hace |
|---------|----------|
| `package.json` | Lista de dependencias |
| `next.config.js` | Configuración de Next.js |
| `tailwind.config.js` | Configuración de estilos |
| `postcss.config.js` | Procesador CSS |
| `vercel.json` | Configuración de deploy |
| `.env.local.example` | Template de variables |
| `app/layout.jsx` | Layout principal HTML |
| `app/globals.css` | Estilos globales |
| `app/page.jsx` | **Dashboard completo** (toda la UI) |
| `app/api/analyze/route.js` | API: Perplexity + Gemini |
| `app/api/hooks/route.js` | API: Genera hooks |
| `app/api/post/route.js` | API: Genera post completo |
| `lib/perplexity.js` | Cliente Perplexity Sonar |
| `lib/gemini.js` | Cliente Gemini Flash |
| `lib/supabase.js` | Cliente Supabase |

---

## 💰 COSTOS

| Servicio | Costo/mes |
|----------|----------|
| Perplexity API | USD 0 (cubierto por crédito Pro) |
| Gemini 2.5 Flash | USD 0 (free tier) |
| Supabase | USD 0 (free tier) |
| Vercel | USD 0 (hobby plan) |
| **Total** | **USD 0** |

---

## 🎯 CÓMO FUNCIONA LA APP

```
Vos escribís "LegalTech Argentina"
       ↓
Perplexity Sonar busca en INTERNET REAL
(noticias, artículos, posts de las últimas semanas)
       ↓
Gemini Flash recibe esos datos REALES y los analiza
(genera tendencias, scores, ángulos para TU perfil)
       ↓
Vos elegís una tendencia → Gemini genera 6 HOOKS
(usando las 6 fórmulas: contraintuitivo, número, etc.)
       ↓
Vos elegís un hook → Gemini escribe el POST COMPLETO
(150-200 palabras, estructura LinkedIn, CTA, hashtags)
       ↓
Copiás → Pegás en LinkedIn → 🚀
```
