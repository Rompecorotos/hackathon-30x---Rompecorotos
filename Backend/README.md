## Aqui se encontrara lo relacionado con el Backend, para resolver el problema del agente de pagos automaticos

API en **Next.js 16 (Route Handlers, TypeScript)** sobre **Supabase** (Auth + PostgreSQL con RLS).
El frontend (Vite, carpeta `../Frontend`) la consume bajo `/api` en el mismo origen; la sesión viaja
en cookies httpOnly y el navegador nunca ve claves ni tokens de Supabase.

### Puesta en marcha

1. **Supabase**: crea un proyecto y ejecuta, en orden, las migraciones de `supabase/migrations/`
   (`..._profiles.sql`, `..._payments.sql` y `..._ai_requests.sql`) desde el SQL Editor, o `supabase link` + `supabase db push`.
2. En *Authentication > URL Configuration* añade `http://localhost:5173/api/auth/callback`
   a **Redirect URLs** (y la URL equivalente de producción).
3. `cp .env.example .env.local` y completa `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`
   (clave publicable o *anon*; **no** uses `service_role`, no es necesaria).
   Para el asistente IA añade `GOOGLE_GENERATIVE_AI_API_KEY` (gratis en https://aistudio.google.com/apikey).
4. `npm install && npm run dev` (puerto 3000). En otra terminal: `cd ../Frontend && npm run dev`.
   Si el backend usa otro puerto, define `BACKEND_URL` en `Frontend/.env.local`.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{fullName, email, password}` → 201 con sesión, o 202 `needsConfirmation` |
| POST | `/api/auth/login` | — | `{email, password}` → `{user, profile}` |
| POST | `/api/auth/logout` | — | Cierra la sesión actual |
| GET | `/api/auth/session` | — | `{user, profile}` o `{user: null}` |
| GET | `/api/auth/callback` | — | Destino del email de confirmación (PKCE) → redirige al frontend |
| GET | `/api/profile` | Sí | Perfil propio |
| PATCH | `/api/profile` | Sí | `{fullName}` → perfil actualizado |
| GET/POST | `/api/customers` | Sí | Listar / crear `{name, email}` |
| PATCH/DELETE | `/api/customers/:id` | Sí | Editar / eliminar (en cascada) |
| GET/POST | `/api/subscriptions` | Sí | Listar / crear `{customerId, description, amountCents, currency, billingInterval, nextChargeDate}` |
| PATCH/DELETE | `/api/subscriptions/:id` | Sí | Editar (incl. `status`: active/paused/canceled) / eliminar |
| GET/POST | `/api/payments` | Sí | Listar (`?status=`) / registrar `{subscriptionId, status, dueDate, failureReason?, attemptNumber?}` |
| PATCH/DELETE | `/api/payments/:id` | Sí | Cambiar estado / eliminar |
| POST | `/api/ai/chat` | Sí | Asistente IA (Gemini, streaming de AI SDK) |

### Asistente IA

Un único asistente cubre **soporte** (dudas sobre Bankly) y **agente de pagos**: con herramientas de
solo lectura (`resumenCobros`, `cobrosFallidos`, `proximosCobros`, `buscarCliente`) analiza los datos
del comercio y recomienda reintentos y acciones. Usa el cliente de Supabase del usuario, así que RLS
limita lo que ve; no ejecuta cobros ni modifica datos. Límite por usuario configurable
(`AI_DAILY_LIMIT`, `AI_PER_MINUTE_LIMIT`, tabla `ai_requests`) para no agotar la cuota gratuita.

Errores: `{error, fields?}` con 400/401/403/404/409/415/422/429/503. Las mutaciones exigen
`Content-Type: application/json` y un `Origin` incluido en `FRONTEND_ORIGIN` (protección CSRF).

### Producción

El frontend debe reenviar `/api/*` al backend en su mismo dominio (p. ej. *rewrites* del hosting)
para que las cookies sigan siendo first-party, y `FRONTEND_ORIGIN` debe apuntar a ese dominio.

### Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck`
