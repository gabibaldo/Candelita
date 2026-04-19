Revisá la consistencia visual y de UX del archivo o componente indicado en este proyecto.

Archivo a revisar: $ARGUMENTS

Verificar:
1. **Clases Tailwind** — usa `card`, `btn-primary`, `btn-ghost`, `btn-danger`, `chip`, `input`, `label`, `section-title` donde corresponde (no clases ad-hoc que dupliquen estilos).
2. **Timezone** — toda fecha/hora mostrada al usuario usa `timeZone: "America/Argentina/Buenos_Aires"`.
3. **Estados vacíos** — si hay listas, existe un `<EmptyState>` para cuando no hay datos.
4. **Responsive** — el layout funciona en mobile (bottom nav) y desktop (sidebar).
5. **Loading/error** — los formularios muestran estado de guardado y errores inline.
6. **Accesibilidad básica** — inputs tienen `<label>`, botones tienen texto o `aria-label`.

Reportá solo los problemas encontrados con la línea exacta y la corrección concreta. No toques lo que esté bien.
