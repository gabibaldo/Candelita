# Pasos a futuro — Candelita app

---

## 🔴 Prioridad alta — Seguridad y estabilidad

### S-1. Guardas de autenticación en páginas protegidas
Todas las páginas (excepto `/login`) necesitan verificar la sesión y redirigir si no hay usuario.
Afecta: `/`, `/calendario`, `/pacientes`, `/estadisticas`, `/perfil` y sus subpáginas.
```ts
const session = await getSession();
if (!session) redirect('/login');
```

### S-2. Recuperación de contraseña funcional
El formulario de "¿Olvidaste tu contraseña?" existe en el login pero no tiene backend.
Implementar: generación de token temporal → email con link → formulario para nueva contraseña.
Depende de tener Resend configurado (ver punto F-2).

### S-3. Control de acceso a archivos adjuntos
Los archivos subidos son accesibles con solo tener el URL, sin autenticación.
La ruta `GET /api/archivos/[id]` debe verificar que el usuario esté logueado antes de servir el archivo.

### S-4. Páginas de error amigables
Si una query falla o hay un error inesperado, la página entera se rompe sin mensaje.
Agregar `error.tsx` en cada sección principal (`app/error.tsx`, `app/pacientes/error.tsx`, etc.).

---

## 🟡 Prioridad media — UX mobile

### M-1. Bottom nav con demasiados ítems
Con 5 ítems en pantalla chica (375px) queda muy comprimido.
Solución: sacar "Perfil" y "Estadísticas" del bottom nav y moverlos a un menú "Más" o a un ícono de ajustes.

### M-2. Modales tapados por el teclado virtual
Los modales de "Nuevo turno" y "Editar turno" usan `fixed inset-0` pero no contemplan el teclado del celular.
Solución: agregar `max-h-[90dvh] overflow-y-auto` al contenedor del formulario dentro del modal.

### M-3. Touch targets demasiado chicos
Los botones "confirmar" y "cobrar" en la agenda semanal tienen padding mínimo y font de 10px.
En mobile el área tocable debería ser mínimo 44×44px para evitar errores de toque.

### ~~M-4. Vista de calendario sin indicación de scroll horizontal~~
~~Eliminado — la vista semanal en mobile fue quitada.~~

---

## 🟡 Prioridad media — UX desktop

### D-1. Sidebar con espacio desaprovechado
El área debajo del nav en el sidebar está vacía.
Mejorar: mostrar el próximo turno del día, cantidad de turnos sin cobrar, o un acceso rápido a "nueva sesión".

### D-2. Estadísticas: layout más aprovechado en desktop
La página de estadísticas es todo scroll vertical.
En desktop (lg+) mostrar las barras de ingresos y asistencia lado a lado, y agregar un widget de "mejor mes".

### D-3. Ficha de paciente: sección de archivos mejor ubicada
Los archivos adjuntos están al fondo de una página ya larga.
Reorganizar la ficha en tabs: "Información", "Turnos", "Historia clínica", "Archivos".

### D-4. Calendario mensual sin indicador de cantidad
En vista mensual, los eventos se listan uno por uno sin resumen del día.
Agregar un badge con el total de turnos por día cuando hay más de 2.

---

## 🟢 Prioridad normal — Funcionalidades nuevas

### F-1. Módulo de facturación (PDF)
Generar recibos/comprobantes en PDF usando los datos del perfil de Cande (CUIT, razón social, CBU) y del turno/paciente.
**Etapa futura:** integración con AFIP para factura electrónica oficial.

### F-2. Google Calendar + recordatorio por email
- Turno virtual → evento automático en Google Calendar con link de Meet.
- Email de recordatorio para Cande a las 22h del día anterior con resumen del paciente.
- Email via Resend (gratuito hasta 3.000/mes). Scheduling con Vercel Cron Jobs en producción.

### F-3. Asistente IA — Generador de resumen de sesión
Al cargar una sesión, Cande escribe notas breves y la IA genera un texto clínico estructurado.
Integrado en el formulario de sesión. Usa API de Anthropic o OpenAI. Costo: centavos por uso.

### F-4. Asistente IA — Generador de informe de evolución
Botón "Generar informe" en la ficha del paciente: la IA lee las últimas N sesiones y produce un borrador de informe de evolución terapéutica descargable como PDF.

### F-5. Exportar datos (backup)
Botón en perfil para exportar todos los pacientes, turnos y sesiones a un archivo CSV o JSON.
Importante tener antes del deploy para no perder datos si algo sale mal.

### F-6. Deploy y accesibilidad remota

| Servicio | Uso | Costo |
|---|---|---|
| **Vercel** | Hosting Next.js | Gratuito |
| **Neon** | PostgreSQL serverless (reemplaza SQLite) | Gratuito |
| **Resend** | Emails transaccionales | Gratuito |
| **Vercel Cron Jobs** | Recordatorios programados | Gratuito (hasta 2 jobs) |

Pasos: cambiar provider en schema → crear DB en Neon → `prisma migrate deploy` → configurar env vars en Vercel → conectar repo.

---

## Notas técnicas pendientes

- Los casts `(prisma.usuario as any)` y `(prisma.archivo as any)` se eliminan después de correr `npx prisma generate` con el schema actualizado.
- Correr `npm run db:push` después de cualquier cambio en `schema.prisma` antes de levantar el servidor.
