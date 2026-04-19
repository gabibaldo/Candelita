# Pasos a futuro — Candelita app

## Orden sugerido de implementación

---

### 1. Módulo de facturación (PDF)
Generar recibos/comprobantes en PDF directamente desde la app, usando los datos ya cargados en el perfil de Cande (CUIT, razón social, condición AFIP, CBU, etc.) y los datos del turno/paciente. No depende de servicios externos.

**Etapa futura:** integración con AFIP (factura electrónica oficial) una vez que la app esté en producción y Cande lo necesite.

---

### 2. Google Calendar + recordatorio por email
- Al crear un turno **virtual**, se crea automáticamente un evento en Google Calendar con link de Google Meet adjunto.
- El link de Meet queda guardado en el turno y se puede enviar al tutor.
- Se agenda un email de recordatorio para Cande el día del turno con un resumen del paciente: datos de contacto del tutor, diagnóstico, última sesión registrada y notas relevantes.
- Email via **Resend** (gratuito, hasta 3.000 mails/mes).
- Scheduling: `node-cron` en local → **Vercel Cron Jobs** en producción.
- Google Calendar: OAuth2, Cande autoriza una sola vez.

---

### 3. Asistente IA — Generador de resumen de sesión
Al cargar una sesión clínica, Cande puede escribir notas breves y la IA le propone un texto clínico estructurado completo. Integrado directamente en el formulario de carga de sesión, no requiere aprender a hacer prompts. Cande revisa y ajusta antes de guardar.

- API: Anthropic (Claude) o OpenAI
- Costo: centavos por uso, solo cuando se activa
- Privacidad: se envía solo el resumen de esa sesión, no toda la historia

---

### 4. Asistente IA — Generador de informe de evolución
Desde la ficha de un paciente, con un botón "Generar informe", la IA lee las últimas N sesiones registradas y produce un borrador de informe de evolución terapéutica. Cande edita y descarga como PDF.

- Se apoya en el módulo de facturación/PDF (punto 1)
- Mismo stack de API que el punto 3
- Privacidad: los datos del paciente salen del dispositivo hacia la API → considerar consentimiento informado

---

### 5. Deploy y accesibilidad remota
Para que la app sea accesible desde cualquier computadora o celular:

| Servicio | Uso | Costo |
|---|---|---|
| **Vercel** | Hosting Next.js | Gratuito |
| **Neon** | PostgreSQL serverless (reemplaza SQLite) | Gratuito |
| **Resend** | Emails transaccionales | Gratuito |
| **Vercel Cron Jobs** | Recordatorios programados | Gratuito (hasta 2 jobs) |

**Pasos de migración:**
1. Cambiar `provider = "sqlite"` → `"postgresql"` en `prisma/schema.prisma`
2. Crear base de datos en Neon y configurar `DATABASE_URL`
3. Correr `npx prisma migrate deploy`
4. Configurar variables de entorno en Vercel
5. Conectar repo a Vercel → deploy automático con cada `git push`

---

## Notas técnicas

- Los casts `(prisma.usuario as any)` en `api/perfil/route.ts` se pueden eliminar una vez corrido `npx prisma generate` con el schema actualizado.
- El campo `modalidad` en `Turno` requiere que el usuario haya corrido `npx prisma db push` localmente.
