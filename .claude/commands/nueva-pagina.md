Crea una nueva página Next.js (App Router) para este proyecto de gestión de turnos de psicología.

Nombre/ruta de la página: $ARGUMENTS

Requisitos:
- Archivo en `src/app/<ruta>/page.tsx` como Server Component con `export const dynamic = "force-dynamic"`.
- Validar sesión con `getSession()` de `@/lib/auth` y redirigir a `/login` si no hay sesión.
- Consultar Prisma directamente en el Server Component (no fetch a la API).
- Usar los componentes existentes: `Avatar`, `EmptyState`, `Shell` (ya wrappea el layout).
- Clases Tailwind consistentes con el resto: `card`, `btn-primary`, `btn-ghost`, `chip`, `section-title`, `input`, `label`, `textarea`.
- Iconos de `lucide-react`.
- Todas las fechas con `timeZone: "America/Argentina/Buenos_Aires"`.
- Si necesita interactividad (formulario, filtros), extraer a un Client Component separado en `src/components/`.

Generá la página mínima funcional sin features no pedidas.
