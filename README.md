# Candelita · Consultorio de Cande

App web para gestionar pacientes, turnos y historia clínica del consultorio
de Cande (psicóloga infantil). Pensada para usarse desde la PC y desde el
celular con los mismos datos.

## Qué trae

- **Login** con usuario y contraseña (cookie firmada con JWT).
- **Pacientes (ABM)**: datos básicos, tutor/responsable, obra social o
  particular, importe por sesión, motivo de consulta y diagnóstico.
- **Calendario** con vista semanal y mensual. Horario de trabajo 14–20hs
  bloqueado visualmente. **Drag & drop** para mover turnos entre días y
  horarios, y para redimensionar la duración.
- **Historia clínica** por paciente: se carga un resumen después de cada
  sesión (con objetivos y próximos pasos) y queda archivado en orden
  cronológico.
- **Recordatorios del día**: al abrir la app, ves tus turnos de hoy con un
  mini-resumen del paciente (motivo, diagnóstico, tutor y teléfono).
- **Exportar historia clínica a PDF** desde la ficha del paciente.
- Distinción visual entre pacientes **particulares** (verde) y **obra
  social** (azul), y totales de facturación estimada del día separados por
  tipo.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- [Prisma](https://www.prisma.io/) + SQLite (fácil de migrar a Postgres)
- [FullCalendar](https://fullcalendar.io/) para la agenda con drag & drop
- [Tailwind CSS](https://tailwindcss.com/) para la UI
- [pdf-lib](https://pdf-lib.js.org/) para exportar la historia clínica
- [jose](https://github.com/panva/jose) + bcrypt para la auth

## Puesta en marcha local

Requisitos: Node 18+.

```bash
npm install
cp .env.example .env           # ajustá AUTH_SECRET e INITIAL_PASSWORD
npm run db:push                # crea la base SQLite y las tablas
npm run db:seed                # crea el usuario inicial (Cande)
npm run dev
```

Abrí <http://localhost:3000>, ingresá con:

- Email: `cande@candelita.app`
- Contraseña: la que hayas puesto en `INITIAL_PASSWORD` (por defecto
  `candelita2026`).

Para cambiar la contraseña más adelante, actualizá `INITIAL_PASSWORD` en
`.env` y corré `npm run db:seed` de nuevo.

### Ver/editar datos con Prisma Studio

```bash
npm run db:studio
```

## Deploy para usar desde PC + celular

Tres opciones fáciles, ordenadas por simplicidad:

### Opción A · Railway (recomendado, incluye base de datos persistente)

1. Subí el repo a GitHub.
2. En [railway.app](https://railway.app) → *New project → Deploy from
   GitHub repo*.
3. En **Variables**, agregá:
   - `DATABASE_URL` → Railway te da una Postgres (usá su URL) o bien podés
     dejar SQLite en un *volume*.
   - `AUTH_SECRET` → cualquier string largo y aleatorio.
   - `INITIAL_PASSWORD` → contraseña inicial de Cande.
4. Si usás Postgres, cambiá en `prisma/schema.prisma` el bloque
   `datasource` a:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   y corré `npx prisma migrate dev --name init` localmente antes de
   desplegar.
5. Railway corre `npm run build` (genera Prisma, aplica migraciones y
   buildea Next) y luego `npm run start`.

### Opción B · Vercel + Turso (SQLite en la nube)

1. Creá una base en [turso.tech](https://turso.tech) y copiá su URL
   (`libsql://…`) y token.
2. Cambiá el `datasource` a `libsql` o usá el adapter oficial.
3. Subí a Vercel y configurá `DATABASE_URL`, `AUTH_SECRET` y
   `INITIAL_PASSWORD`.

### Opción C · Self-hosted (una PC siempre prendida)

1. `npm run build && npm run start -- -p 3000`
2. Exponé el puerto con [Tailscale](https://tailscale.com/) o
   [ngrok](https://ngrok.com/) y desde el celular accedés por la URL
   privada.

## Cómo lo usa Cande

- **Crear un paciente**: *Pacientes → + Nuevo paciente*. Elegí
  *Particular* u *Obra social* (si es obra social aparecen los campos de
  afiliado y sesiones autorizadas). El importe por sesión se usa como
  valor por defecto al crear turnos.
- **Cargar un turno**: *Calendario → tocá/arrastrá sobre un hueco entre
  14 y 20hs*. Elegí el paciente, guardá. Después podés arrastrar el turno
  para moverlo de día o de horario, o estirar el borde inferior para
  cambiar la duración.
- **Registrar una sesión**: desde el dashboard, *+ cargar sesión* al lado
  de cada turno, o desde la ficha del paciente en *Historia clínica → Cargar
  sesión*. Si la vinculás a un turno, ese turno queda marcado como
  *realizado*.
- **Exportar historia clínica**: dentro de la ficha del paciente, botón
  *Exportar PDF*. Abre el PDF en una pestaña nueva, listo para guardar
  o compartir.

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx               # Dashboard / Hoy
│   ├── login/page.tsx
│   ├── pacientes/             # ABM de pacientes
│   ├── calendario/page.tsx    # Vista de agenda
│   └── api/                   # API REST interna
├── components/                # UI (Nav, Calendar, forms…)
├── lib/                       # db, auth, utils
└── middleware.ts              # protege todo salvo /login
prisma/
├── schema.prisma              # modelos de datos
└── seed.ts                    # crea el usuario inicial
```

## Notas de seguridad

- Las historias clínicas son información sensible: usá una contraseña
  fuerte, activá HTTPS en producción y hacé backups periódicos de la
  base. Idealmente, cifrar el disco del servidor.
- La app asume un único usuario. Para multiusuario, ampliar el modelo
  `Usuario` y filtrar todas las queries por `usuarioId`.
