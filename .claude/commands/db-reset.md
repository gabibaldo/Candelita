Resetea la base de datos de desarrollo y recarga los datos de prueba.

Ejecuta en orden:
1. `npx prisma db push --force-reset` — borra y recrea todas las tablas según el schema actual.
2. `npm run db:seed` — crea el usuario inicial (cande@candelita.app / candelita2026) y los 10 pacientes de prueba con turnos de la semana y sesiones.

Advertencia: esto borra TODOS los datos existentes. Solo usar en desarrollo.

Luego de ejecutar, confirmar que el seed devolvió "✓ Seed completo." sin errores.
