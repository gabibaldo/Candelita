Crea una nueva API route para este proyecto Next.js de gestión de turnos de psicología.

Recurso/funcionalidad: $ARGUMENTS

Requisitos:
- Archivo en `src/app/api/<recurso>/route.ts` (o `[id]/route.ts` para rutas dinámicas).
- Siempre verificar sesión con `getSession()` y retornar `NextResponse.json({ error: "No autenticado" }, { status: 401 })` si no hay sesión.
- Usar `prisma` de `@/lib/db`.
- Validar body con Zod antes de tocar la DB. Retornar `{ error: string }` con status 400 si falla la validación.
- Retornar errores con el status HTTP correcto (400, 401, 404, 500).
- Sin lógica de negocio compleja: mantener la route simple y delegar a Prisma.
- Todas las fechas recibidas como ISO string, almacenadas como `new Date(isoString)`.

Incluir solo los métodos HTTP que se pidan (GET, POST, PATCH, DELETE).
