## Aqui se encontrara lo relacionado con el Backend, para resolver el problema del agente de pagos automaticos

API en **Next.js 16 (Route Handlers, TypeScript)** sobre **Supabase** (Auth + PostgreSQL con RLS).
El frontend (Vite, carpeta `../Frontend`) la consume bajo `/api` en el mismo origen; la sesión viaja
en cookies httpOnly y el navegador nunca ve claves ni tokens de Supabase.

### Puesta en marcha

1. **Supabase**: crea un proyecto y ejecuta `supabase/migrations/20261017000000_profiles.sql`
   (SQL Editor, o `supabase link` + `supabase db push` con la CLI).
2. En *Authentication > URL Configuration* añade `http://localhost:5173/api/auth/callback`
   a **Redirect URLs** (y la URL equivalente de producción).
3. `cp .env.example .env.local` y completa `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`
   (clave publicable o *anon*; **no** uses `service_role`, no es necesaria).
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

Errores: `{error, fields?}` con 400/401/403/404/409/415/422/429/503. Las mutaciones exigen
`Content-Type: application/json` y un `Origin` incluido en `FRONTEND_ORIGIN` (protección CSRF).

### Producción

El frontend debe reenviar `/api/*` al backend en su mismo dominio (p. ej. *rewrites* del hosting)
para que las cookies sigan siendo first-party, y `FRONTEND_ORIGIN` debe apuntar a ese dominio.

### Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck`
