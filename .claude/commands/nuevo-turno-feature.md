Agregá una nueva funcionalidad relacionada con turnos o agenda en este sistema de gestión de psicología.

Feature: $ARGUMENTS

Contexto del modelo de datos:
- `Turno`: pacienteId, inicio, fin (DateTime UTC), estado (programado|realizado|cancelado|ausente), importe (Float?), cobrado (Boolean), notas (String?).
- `Paciente`: tipo (particular|obra_social), importeSesion, obraSocialNombre, tutorNombre, tutorTelefono.
- `Sesion`: vinculada opcionalmente a un Turno (1-1), contiene resumen clínico.

Restricciones del calendario:
- Horario visible: 13:00–21:00 hs Argentina.
- Horario de negocio (drag/select): 14:00–20:00 hs, lunes a sábado.
- Timezone siempre `America/Argentina/Buenos_Aires`.
- FullCalendar v6 con plugins: timeGrid, dayGrid, interaction.

Implementá solo lo pedido. Si afecta la API y el componente, hacé los dos cambios. Si solo afecta uno, tocá solo ese.
