# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reglas de comportamiento

1. **Contexto primero** — leer archivos relevantes antes de escribir código. Si falta contexto, preguntar.
2. **Respuestas cortas** — 1-3 oraciones. Sin preámbulos ni resumen final. No repetir lo que dijo el usuario.
3. **Edits parciales** — usar `Edit`, nunca `Write` en archivos existentes salvo que el cambio sea >80% del archivo.
4. **No releer** — si ya se leyó un archivo en la conversación, no volver a leerlo salvo que haya cambiado.
5. **Validar antes de declarar hecho** — compilar o verificar que funciona. Nunca decir "listo" sin evidencia.
6. **Sin adulación** — no decir "Excelente pregunta", "Gran idea", etc. Ir directo al trabajo.
7. **Soluciones mínimas** — implementar solo lo pedido. Sin abstracciones, helpers ni features extra.
8. **No debatir** — si el usuario dice "hacelo así", hacerlo así. Mencionar un concern en 1 oración y proceder.
9. **Leer solo lo necesario** — usar `offset`/`limit`. Si se sabe la ruta, usar `Read` directo.
10. **No narrar el plan** — no anunciar lo que se va a hacer. Ejecutar directamente.
11. **Paralelizar tool calls** — leer múltiples archivos independientes en un solo mensaje.
12. **No duplicar código en la respuesta** — si ya se editó un archivo, no copiarlo en el texto.
13. **Agent solo para búsquedas amplias** — para una función o archivo específico, usar `Grep`/`Glob` directo.

## Comandos

```bash
npm run dev          # Servidor de desarrollo (Next.js)
npm run build        # Genera Prisma client + migra + build
npm run db:push      # Sincroniza schema sin migraciones (dev)
npm run db:migrate   # Crea y aplica migraciones
npm run db:seed      # Crea usuario inicial + 10 pacientes de prueba
npm run db:studio    # Abre Prisma Studio en el browser
```

Credenciales de prueba: `cande@candelita.app` / `candelita2026`

## Arquitectura

**Stack:** Next.js 16 (App Router) · Prisma 5 + SQLite · Tailwind CSS · FullCalendar 6 · pdf-lib · JWT (jose) + bcryptjs

**Autenticación:** JWT almacenado en cookie httpOnly. `src/lib/auth.ts` expone `getSession()` (server) y `createSession()`. Todas las API routes validan con `getSession()` y devuelven 401 si no hay sesión. No existe middleware de Edge para rutas de página — la auth se verifica en cada Server Component o API route.

**Flujo de datos:**
- Server Components (`page.tsx`) consultan Prisma directamente.
- Client Components (`Calendar.tsx`, formularios) llaman a las API routes vía `fetch`.
- Las API routes están en `src/app/api/` y siguen el patrón de `route.ts` con `GET`/`POST`/`PATCH`/`DELETE`.

**Timezone:** La app opera en `America/Argentina/Buenos_Aires` (UTC-3 fijo, sin DST). Todas las fechas se guardan en UTC en SQLite. Para calcular rangos de día/semana usar siempre el offset explícito `-03:00` o la función `arDateStr()` del dashboard.

**Modelos Prisma** (`prisma/schema.prisma`):
- `Usuario` — cuenta única de Cande.
- `Paciente` — datos personales, tutor, tipo (`particular` | `obra_social`), `importeSesion`.
- `Turno` — `inicio`/`fin` DateTime, `estado` (`programado`|`realizado`|`cancelado`|`ausente`), `cobrado`.
- `Sesion` — historia clínica de cada turno; opcionalmente vinculada a un `Turno` (1-1).

**Componentes clave:**
- `Shell.tsx` — layout con sidebar desktop / bottom nav mobile.
- `Calendar.tsx` — FullCalendar con `timeZone="America/Argentina/Buenos_Aires"`, drag & drop, modal de turno. Horario visible: 13–21hs, negocio: 14–20hs lun–sáb.
- `Toast.tsx` — sistema de toasts + modal de confirmación vía Context (`useToast`).

**Generación de PDF:** `src/app/api/historia/[id]/pdf/route.ts` usa `pdf-lib` con Helvetica (Latin-1). Los caracteres fuera de Latin-1 deben sanitizarse antes de insertar en el PDF.
