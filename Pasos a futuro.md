# Pasos a futuro — Candelita app

---

## ~~Funcionalidades IA~~ ✅

### ~~F-3. Asistente IA — Generador de resumen de sesión~~ ✅
Botón "IA" en el formulario de sesión. Envía las notas a `POST /api/ia/resumen` (Claude Haiku 4.5 + prompt caching). Reemplaza el textarea con el resumen clínico estructurado generado.

### ~~F-4. Asistente IA — Generador de informe de evolución~~ ✅
Botón "Generar informe de evolución" en la tab Historia clínica. Llama a `POST /api/ia/informe` (Claude Opus 4.7 + adaptive thinking + prompt caching). Muestra el informe en textarea editable con botón Copiar.

---

## ~~Notas técnicas pendientes~~ ✅

- ~~Los casts `(prisma.usuario as any)` y `(prisma.archivo as any)` se eliminan después de correr `npx prisma generate` con el schema actualizado.~~ Todos los casts `as any` de Prisma eliminados. `turnos as any` reemplazado por `turnos as TurnoDelDia[]` con el import correcto.

---

## 🔐 Seguridad

### 🔴 Críticas — ✅ Todas resueltas

#### ~~S-C1. Rate limiting en login y reset de contraseña~~ ✅
Rate limiter in-memory implementado en `src/lib/ratelimit.ts`. 5 intentos de login/15 min, 3 resets/hora, 20 uploads/hora. Sin dependencias nuevas.

#### ~~S-C2. OAuth Google sin state parameter (CSRF)~~ ✅
`getAuthUrl(state)` acepta state. `/api/google/auth` genera token aleatorio y lo guarda en cookie `HttpOnly`. El callback valida el state antes de procesar el code.

#### ~~S-C3. IDOR sin validación de propiedad de recursos~~ ✅
Campo `usuarioId` agregado a `Paciente` (`@default(1)`, DB migrada). Los 4 endpoints dinámicos (`pacientes/[id]`, `turnos/[id]`, `sesiones/[id]`, `archivos/[id]`) validan ownership y devuelven 403 si no coincide.

---

### 🔴 Críticas (re-clasificadas)

#### ~~S-C4. Sesión sin renovación automática~~ ✅
Ya estaba implementado en `src/proxy.ts` (sesión deslizante en cada request autenticado, máximo absoluto de 2 horas).

---

### 🟠 Altas — ✅ Todas resueltas

#### ~~S-A1. Google access token expuesto en `/api/perfil`~~ ✅
`perfil/route.ts` ahora retorna `{ googleConnected: boolean }` en lugar del token crudo. Frontend actualizado.

#### ~~S-A2. Headers de seguridad HTTP ausentes~~ ✅
`next.config.mjs` con `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.

#### ~~S-A3. CORS sin configurar~~ ✅
`next.config.mjs` con `Access-Control-Allow-Origin` fijado a `NEXT_PUBLIC_BASE_URL` en todas las rutas `/api/`.

#### ~~S-A4. Validación de archivos solo por MIME header~~ ✅
`archivos/route.ts` detecta magic bytes manualmente (JPEG, PNG, GIF, WebP, PDF, ZIP/OOXML, OLE, ELF, PE, Mach-O). Si detecta ejecutable → 400.

#### ~~S-A5. Endpoint de exportación sin protección~~ ✅
`/api/exportar` ahora es POST. Requiere `{ password }` verificado con bcrypt. Rate limit: 3 por día. UI con form de confirmación inline.

#### ~~S-A6. Password reset vulnerable a timing attack~~ ✅
`reset-confirm/route.ts` agrega `minDelay` (700–1000ms) en todas las respuestas de error.

---

### 🟡 Medias — ✅ Todas resueltas

#### ~~S-M1. `parseId()` acepta 0 y negativos~~ ✅
Corregido en `pacientes/[id]`, `turnos/[id]`, `sesiones/[id]`.

#### ~~S-M2. Token de reset expuesto en URL~~ ✅
URL cambiada a `#token=xxx&email=xxx` (fragment). El servidor nunca recibe el token en logs. `reset-password/page.tsx` lee del hash vía `useEffect`.

#### ~~S-M3. Cron con comparación de strings normal~~ ✅
`cron/recordatorio/route.ts` usa `crypto.timingSafeEqual` para validar `CRON_SECRET`.

#### ~~S-M4. Log con token de reset en plaintext~~ ✅
`reset-request/route.ts` loguea solo `"[reset-request] Fallback: token generado para <email>"`.

#### ~~S-M5. Nombres de archivo sin sanitizar en DB~~ ✅
`archivos/route.ts` aplica `replace(/[^a-zA-Z0-9.\-_ ]/g, "_").slice(0, 255)` al guardar `nombre`.

---

### 🟢 Bajas

#### ~~S-B1. Campos de texto libre sin límite Zod~~ ✅
`.max(10000)` en `resumen`, `objetivos`, `proximosPasos`, `motivoConsulta`, `diagnostico`, `objetivosTerapeuticos`, `notasGenerales`, `derivaciones`. `.max(5000)` en `notas` de turnos.

#### ~~S-B2. Email remitente con dominio genérico~~ ✅
`email.ts` y `reset-request/route.ts` usan `process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"`.

#### ~~S-B3. Sin audit log~~ ✅
Modelo `AuditLog` en Prisma (`db push` aplicado). Helper `src/lib/audit.ts`. Loguea: `login_ok`, `login_fail`, `export`, `file_upload`, `file_delete`, `pwd_change`, `pwd_reset`.
