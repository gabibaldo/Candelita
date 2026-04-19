import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Argentina is UTC-3. Helper: build a UTC Date from an Argentina datetime.
function ar(dateStr: string, timeStr: string): Date {
  // e.g. ar("2026-04-16", "14:00") → 2026-04-16T17:00:00.000Z
  return new Date(`${dateStr}T${timeStr}:00-03:00`);
}

async function main() {
  const email = process.env.SEED_EMAIL ?? "cande@candelita.app";
  const nombre = process.env.SEED_NOMBRE ?? "Candela Berardi";
  const password = process.env.INITIAL_PASSWORD ?? "candelita2026";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.usuario.upsert({
    where: { email },
    update: { nombre, passwordHash },
    create: { email, nombre, passwordHash },
  });
  console.log(`Usuario listo: ${user.email}`);

  // Only seed if test patients haven't been loaded yet (check for 10+)
  const count = await prisma.paciente.count();
  if (count >= 10) {
    console.log(`Ya existen ${count} pacientes. Seed de pacientes omitido.`);
    return;
  }

  // ── 10 pacientes ──────────────────────────────────────────────
  const pacientes = await prisma.paciente.createManyAndReturn({
    data: [
      {
        nombre: "María",
        apellido: "González",
        fechaNacimiento: new Date("2017-03-12"),
        telefono: null,
        tipo: "particular",
        importeSesion: 15000,
        motivoConsulta: "Dificultades de atención en el colegio",
        diagnostico: "TDAH a descartar",
        tutorNombre: "Ana González",
        tutorTelefono: "1134567890",
        tutorRelacion: "madre",
        tutorDni: "28.456.789",
      },
      {
        nombre: "Lucía",
        apellido: "Ramírez",
        fechaNacimiento: new Date("1990-07-22"),
        telefono: "1145678901",
        tipo: "particular",
        importeSesion: 18000,
        motivoConsulta: "Ansiedad generalizada y dificultades para dormir",
        diagnostico: "TAG",
      },
      {
        nombre: "Carlos",
        apellido: "Fernández",
        fechaNacimiento: new Date("1983-11-05"),
        telefono: "1156789012",
        tipo: "obra_social",
        obraSocialNombre: "OSDE",
        numeroAfiliado: "1234567",
        sesionesAutorizadas: 20,
        importeSesion: 8000,
        motivoConsulta: "Episodio depresivo mayor",
        diagnostico: "Depresión moderada",
      },
      {
        nombre: "Valentina",
        apellido: "Sosa",
        fechaNacimiento: new Date("2019-01-30"),
        tipo: "particular",
        importeSesion: 15000,
        motivoConsulta: "Miedos nocturnos y dificultades de separación",
        tutorNombre: "Roberto Sosa",
        tutorTelefono: "1167890123",
        tutorRelacion: "padre",
        tutorDni: "31.234.567",
      },
      {
        nombre: "Martín",
        apellido: "López",
        fechaNacimiento: new Date("1997-05-14"),
        telefono: "1178901234",
        tipo: "obra_social",
        obraSocialNombre: "Swiss Medical",
        numeroAfiliado: "9876543",
        sesionesAutorizadas: 12,
        importeSesion: 7000,
        motivoConsulta: "Estrés laboral crónico",
        diagnostico: "Síndrome de burnout",
      },
      {
        nombre: "Sofía",
        apellido: "Torres",
        fechaNacimiento: new Date("2010-09-18"),
        tipo: "particular",
        importeSesion: 15000,
        motivoConsulta: "Baja autoestima y conflictos vinculares en la escuela",
        tutorNombre: "Claudia Torres",
        tutorTelefono: "1189012345",
        tutorRelacion: "madre",
        tutorDni: "25.678.901",
      },
      {
        nombre: "Diego",
        apellido: "Martínez",
        fechaNacimiento: new Date("1994-02-28"),
        telefono: "1190123456",
        tipo: "particular",
        importeSesion: 18000,
        motivoConsulta: "Duelo por pérdida de pareja",
        diagnostico: "Duelo complicado",
      },
      {
        nombre: "Isabella",
        apellido: "Romero",
        fechaNacimiento: new Date("2016-06-07"),
        tipo: "obra_social",
        obraSocialNombre: "IOMA",
        numeroAfiliado: "4567890",
        sesionesAutorizadas: 16,
        importeSesion: 6000,
        motivoConsulta: "Enuresis nocturna y ansiedad escolar",
        tutorNombre: "Patricia Romero",
        tutorTelefono: "1101234567",
        tutorRelacion: "madre",
        tutorDni: "29.876.543",
      },
      {
        nombre: "Agustín",
        apellido: "Herrera",
        fechaNacimiento: new Date("2003-12-01"),
        telefono: "1112345678",
        tipo: "particular",
        importeSesion: 16000,
        motivoConsulta: "Crisis de pánico recurrentes",
        diagnostico: "Trastorno de pánico",
      },
      {
        nombre: "Elena",
        apellido: "Díaz",
        fechaNacimiento: new Date("1970-04-09"),
        telefono: "1123456789",
        tipo: "particular",
        importeSesion: 18000,
        motivoConsulta: "Duelo tardío y reorganización de la identidad",
        diagnostico: "Duelo crónico. Síntomas depresivos leves.",
      },
    ],
  });

  const [maria, lucia, carlos, valentina, martin, sofia, diego, isabella, agustin, elena] =
    pacientes;

  console.log(`${pacientes.length} pacientes creados.`);

  // ── Turnos semana 14-19 abril 2026 ────────────────────────────
  // Lunes 14/04
  const t1 = await prisma.turno.create({
    data: { pacienteId: maria.id, inicio: ar("2026-04-14","14:00"), fin: ar("2026-04-14","14:45"), estado: "realizado", cobrado: true },
  });
  await prisma.turno.create({
    data: { pacienteId: lucia.id, inicio: ar("2026-04-14","15:30"), fin: ar("2026-04-14","16:15"), estado: "realizado", cobrado: true },
  });
  const t3 = await prisma.turno.create({
    data: { pacienteId: carlos.id, inicio: ar("2026-04-14","17:00"), fin: ar("2026-04-14","17:45"), estado: "realizado", cobrado: true },
  });

  // Martes 15/04
  const t4 = await prisma.turno.create({
    data: { pacienteId: valentina.id, inicio: ar("2026-04-15","14:00"), fin: ar("2026-04-15","14:45"), estado: "realizado", cobrado: false },
  });
  await prisma.turno.create({
    data: { pacienteId: martin.id, inicio: ar("2026-04-15","15:30"), fin: ar("2026-04-15","16:15"), estado: "realizado", cobrado: true },
  });
  const t6 = await prisma.turno.create({
    data: { pacienteId: sofia.id, inicio: ar("2026-04-15","17:00"), fin: ar("2026-04-15","17:45"), estado: "realizado", cobrado: true },
  });

  // Miércoles 16/04 — HOY
  await prisma.turno.create({
    data: { pacienteId: diego.id, inicio: ar("2026-04-16","14:00"), fin: ar("2026-04-16","14:45"), estado: "programado", cobrado: false },
  });
  await prisma.turno.create({
    data: { pacienteId: isabella.id, inicio: ar("2026-04-16","15:30"), fin: ar("2026-04-16","16:15"), estado: "programado", cobrado: false },
  });
  await prisma.turno.create({
    data: { pacienteId: agustin.id, inicio: ar("2026-04-16","17:00"), fin: ar("2026-04-16","17:45"), estado: "programado", cobrado: false },
  });
  await prisma.turno.create({
    data: { pacienteId: elena.id, inicio: ar("2026-04-16","18:30"), fin: ar("2026-04-16","19:15"), estado: "programado", cobrado: false },
  });

  // Jueves 17/04
  await prisma.turno.create({
    data: { pacienteId: maria.id, inicio: ar("2026-04-17","14:00"), fin: ar("2026-04-17","14:45"), estado: "programado", cobrado: false },
  });
  await prisma.turno.create({
    data: { pacienteId: lucia.id, inicio: ar("2026-04-17","16:00"), fin: ar("2026-04-17","16:45"), estado: "programado", cobrado: false },
  });
  await prisma.turno.create({
    data: { pacienteId: carlos.id, inicio: ar("2026-04-17","17:30"), fin: ar("2026-04-17","18:15"), estado: "programado", cobrado: false },
  });

  // Viernes 18/04
  await prisma.turno.create({
    data: { pacienteId: martin.id, inicio: ar("2026-04-18","14:00"), fin: ar("2026-04-18","14:45"), estado: "programado", cobrado: false },
  });
  await prisma.turno.create({
    data: { pacienteId: diego.id, inicio: ar("2026-04-18","15:30"), fin: ar("2026-04-18","16:15"), estado: "programado", cobrado: false },
  });

  // Sábado 19/04
  await prisma.turno.create({
    data: { pacienteId: sofia.id, inicio: ar("2026-04-19","14:00"), fin: ar("2026-04-19","14:45"), estado: "programado", cobrado: false },
  });
  await prisma.turno.create({
    data: { pacienteId: agustin.id, inicio: ar("2026-04-19","15:30"), fin: ar("2026-04-19","16:15"), estado: "programado", cobrado: false },
  });

  console.log("Turnos de la semana creados.");

  // ── Sesiones para turnos ya realizados ────────────────────────
  await prisma.sesion.create({
    data: {
      pacienteId: maria.id,
      turnoId: t1.id,
      fecha: ar("2026-04-14", "14:00"),
      resumen: "Primera sesión de la semana. María mostró dificultades para mantener la atención durante la actividad de construcción de bloques. Realizamos ejercicios de respiración y juego estructurado. Buena predisposición.",
      objetivos: "Trabajar la atención sostenida mediante juego guiado.",
      proximosPasos: "Incorporar más actividades de seguimiento de instrucciones en próximas sesiones.",
    },
  });

  await prisma.sesion.create({
    data: {
      pacienteId: carlos.id,
      turnoId: t3.id,
      fecha: ar("2026-04-14", "17:00"),
      resumen: "Carlos refiere mejoría en el estado de ánimo respecto a la semana anterior. Logró retomar rutinas de ejercicio. Trabajamos técnicas de activación conductual y registro de pensamientos automáticos.",
      objetivos: "Consolidar activación conductual y registro cognitivo.",
      proximosPasos: "Revisar autorregistro de la semana en próxima sesión.",
    },
  });

  await prisma.sesion.create({
    data: {
      pacienteId: valentina.id,
      turnoId: t4.id,
      fecha: ar("2026-04-15", "14:00"),
      resumen: "Valentina llegó angustiada por separarse de su mamá. Utilizamos el muñeco de transición con buenos resultados. Trabajamos narrativa del miedo a través de cuento terapéutico.",
      objetivos: "Reducir ansiedad de separación.",
      proximosPasos: "Psicoeducación a la madre sobre reforzamiento positivo en momentos de separación.",
    },
  });

  await prisma.sesion.create({
    data: {
      pacienteId: sofia.id,
      turnoId: t6.id,
      fecha: ar("2026-04-15", "17:00"),
      resumen: "Sofía habló de un conflicto con una compañera de curso. Identificamos pensamientos de catastrofización y los cuestionamos juntas. Buen insight para su edad.",
      objetivos: "Fortalecer habilidades sociales y pensamiento flexible.",
      proximosPasos: "Role playing de situaciones de conflicto en próxima sesión.",
    },
  });

  console.log("Sesiones de prueba creadas.");
  console.log("\n✓ Seed completo.");
  console.log(`  Email: ${email}`);
  console.log(`  Contraseña: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
