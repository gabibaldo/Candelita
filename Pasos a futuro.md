# Pasos a futuro — Candelita app

---

## 🟢 Pendiente — Funcionalidades IA

### F-3. Asistente IA — Generador de resumen de sesión
Al cargar una sesión, Cande escribe notas breves y la IA genera un texto clínico estructurado.
Integrado en el formulario de sesión. Usa API de Anthropic (Claude).
Costo estimado: ~$0.002–0.005 por uso. Sin costo fijo mensual.

### F-4. Asistente IA — Generador de informe de evolución
Botón "Generar informe" en la ficha del paciente: la IA lee las últimas N sesiones y produce un borrador de informe de evolución terapéutica descargable como PDF.
Costo estimado: ~$0.01–0.05 por informe según cantidad de sesiones.

---

## Notas técnicas pendientes

- Los casts `(prisma.usuario as any)` y `(prisma.archivo as any)` se eliminan después de correr `npx prisma generate` con el schema actualizado.
