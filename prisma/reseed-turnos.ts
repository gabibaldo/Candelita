/**
 * Reseed de turnos y sesiones para demo.
 * Borra todos los turnos/sesiones y genera datos realistas.
 *
 * Correr con:  npx tsx prisma/reseed-turnos.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Argentina UTC-3. Helper para construir Date desde fecha/hora AR.
function ar(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-03:00`);
}

async function main() {
  // ── 1. Limpiar turnos y sesiones ────────────────────────────────
  await prisma.sesion.deleteMany();
  await prisma.turno.deleteMany();
  console.log("✓ Turnos y sesiones eliminados.");

  // ── 2. Obtener pacientes en orden ────────────────────────────────
  const pacientes = await prisma.paciente.findMany({
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  if (pacientes.length === 0) {
    console.error("No hay pacientes. Corré npm run db:seed primero.");
    process.exit(1);
  }

  // Asignamos por apellido para que sea determinístico
  const byApellido = Object.fromEntries(pacientes.map((p) => [p.apellido, p]));
  const maria     = byApellido["González"];
  const lucia     = byApellido["Ramírez"];
  const carlos    = byApellido["Fernández"];
  const valentina = byApellido["Sosa"];
  const martin    = byApellido["López"];
  const sofia     = byApellido["Torres"];
  const diego     = byApellido["Martínez"];
  const isabella  = byApellido["Romero"];
  const agustin   = byApellido["Herrera"];
  const elena     = byApellido["Díaz"];

  const importe = 50000;

  // ── 3. TURNOS PASADOS — semana 10-15 marzo 2026 ─────────────────
  // Lunes 09/03
  const t_carlos_1 = await prisma.turno.create({ data: {
    pacienteId: carlos.id, inicio: ar("2026-03-09","17:00"), fin: ar("2026-03-09","17:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});
  const t_diego_1 = await prisma.turno.create({ data: {
    pacienteId: diego.id, inicio: ar("2026-03-09","18:30"), fin: ar("2026-03-09","19:15"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});

  // Martes 10/03
  const t_maria_1 = await prisma.turno.create({ data: {
    pacienteId: maria.id, inicio: ar("2026-03-10","14:00"), fin: ar("2026-03-10","14:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});

  // Miércoles 11/03
  const t_lucia_1 = await prisma.turno.create({ data: {
    pacienteId: lucia.id, inicio: ar("2026-03-11","15:30"), fin: ar("2026-03-11","16:15"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});
  const t_isabella_1 = await prisma.turno.create({ data: {
    pacienteId: isabella.id, inicio: ar("2026-03-11","17:00"), fin: ar("2026-03-11","17:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});

  // Jueves 12/03
  const t_valentina_1 = await prisma.turno.create({ data: {
    pacienteId: valentina.id, inicio: ar("2026-03-12","14:00"), fin: ar("2026-03-12","14:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});
  const t_agustin_1 = await prisma.turno.create({ data: {
    pacienteId: agustin.id, inicio: ar("2026-03-12","16:00"), fin: ar("2026-03-12","16:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});

  // Viernes 13/03
  const t_martin_1 = await prisma.turno.create({ data: {
    pacienteId: martin.id, inicio: ar("2026-03-13","16:00"), fin: ar("2026-03-13","16:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});
  const t_elena_1 = await prisma.turno.create({ data: {
    pacienteId: elena.id, inicio: ar("2026-03-13","18:00"), fin: ar("2026-03-13","18:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});

  // Sábado 14/03
  const t_sofia_1 = await prisma.turno.create({ data: {
    pacienteId: sofia.id, inicio: ar("2026-03-14","14:00"), fin: ar("2026-03-14","14:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});

  // ── 4. TURNOS PASADOS — semana 23-28 marzo 2026 ─────────────────
  // Lunes 23/03
  const t_carlos_2 = await prisma.turno.create({ data: {
    pacienteId: carlos.id, inicio: ar("2026-03-23","17:00"), fin: ar("2026-03-23","17:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});
  const t_diego_2 = await prisma.turno.create({ data: {
    pacienteId: diego.id, inicio: ar("2026-03-23","18:30"), fin: ar("2026-03-23","19:15"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});

  // Martes 24/03
  const t_maria_2 = await prisma.turno.create({ data: {
    pacienteId: maria.id, inicio: ar("2026-03-24","14:00"), fin: ar("2026-03-24","14:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});

  // Miércoles 25/03
  const t_lucia_2 = await prisma.turno.create({ data: {
    pacienteId: lucia.id, inicio: ar("2026-03-25","15:30"), fin: ar("2026-03-25","16:15"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});
  const t_isabella_2 = await prisma.turno.create({ data: {
    pacienteId: isabella.id, inicio: ar("2026-03-25","17:00"), fin: ar("2026-03-25","17:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});

  // Jueves 26/03
  const t_valentina_2 = await prisma.turno.create({ data: {
    pacienteId: valentina.id, inicio: ar("2026-03-26","14:00"), fin: ar("2026-03-26","14:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});
  const t_agustin_2 = await prisma.turno.create({ data: {
    pacienteId: agustin.id, inicio: ar("2026-03-26","16:00"), fin: ar("2026-03-26","16:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});

  // Viernes 27/03
  const t_martin_2 = await prisma.turno.create({ data: {
    pacienteId: martin.id, inicio: ar("2026-03-27","16:00"), fin: ar("2026-03-27","16:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});
  const t_elena_2 = await prisma.turno.create({ data: {
    pacienteId: elena.id, inicio: ar("2026-03-27","18:00"), fin: ar("2026-03-27","18:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});

  // Sábado 28/03
  const t_sofia_2 = await prisma.turno.create({ data: {
    pacienteId: sofia.id, inicio: ar("2026-03-28","14:00"), fin: ar("2026-03-28","14:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});

  // ── 5. SEMANA ACTUAL — 14-18 abril 2026 ─────────────────────────
  // Lunes 14/04 — realizados, cobrados
  const t_carlos_3 = await prisma.turno.create({ data: {
    pacienteId: carlos.id, inicio: ar("2026-04-14","17:00"), fin: ar("2026-04-14","17:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});
  const t_diego_3 = await prisma.turno.create({ data: {
    pacienteId: diego.id, inicio: ar("2026-04-14","18:30"), fin: ar("2026-04-14","19:15"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});

  // Martes 15/04 — realizados, 1 sin cobrar (aparece en deudas)
  const t_maria_3 = await prisma.turno.create({ data: {
    pacienteId: maria.id, inicio: ar("2026-04-15","14:00"), fin: ar("2026-04-15","14:45"),
    estado: "realizado", cobrado: false, importe, modalidad: "presencial",
  }});
  const t_valentina_3 = await prisma.turno.create({ data: {
    pacienteId: valentina.id, inicio: ar("2026-04-15","16:00"), fin: ar("2026-04-15","16:45"),
    estado: "realizado", cobrado: false, importe, modalidad: "virtual",
  }});

  // Miércoles 16/04 — realizados, sin sesión cargada (activa warning)
  await prisma.turno.create({ data: {
    pacienteId: lucia.id, inicio: ar("2026-04-16","15:30"), fin: ar("2026-04-16","16:15"),
    estado: "realizado", cobrado: true, importe, modalidad: "presencial",
  }});
  await prisma.turno.create({ data: {
    pacienteId: isabella.id, inicio: ar("2026-04-16","17:00"), fin: ar("2026-04-16","17:45"),
    estado: "realizado", cobrado: true, importe, modalidad: "virtual",
  }});

  // Jueves 17/04 — HOY — programados
  await prisma.turno.create({ data: {
    pacienteId: agustin.id, inicio: ar("2026-04-17","16:00"), fin: ar("2026-04-17","16:45"),
    estado: "programado", cobrado: false, importe, modalidad: "presencial",
    notas: "Revisar ejercicios de relajación de la semana pasada.",
  }});
  await prisma.turno.create({ data: {
    pacienteId: martin.id, inicio: ar("2026-04-17","18:00"), fin: ar("2026-04-17","18:45"),
    estado: "programado", cobrado: false, importe, modalidad: "virtual",
  }});

  // Viernes 18/04 — mañana — programados
  await prisma.turno.create({ data: {
    pacienteId: elena.id, inicio: ar("2026-04-18","14:00"), fin: ar("2026-04-18","14:45"),
    estado: "programado", cobrado: false, importe, modalidad: "presencial",
  }});
  await prisma.turno.create({ data: {
    pacienteId: sofia.id, inicio: ar("2026-04-18","15:30"), fin: ar("2026-04-18","16:15"),
    estado: "programado", cobrado: false, importe, modalidad: "virtual",
  }});

  // Sábado 19/04 — NO existe (es domingo). El finde visible es vie 18 + sáb 19 ← pero 19 es dom.
  // Turno del sábado ya está incluido arriba (vie 18). No agregar domingo.

  // ── 6. PRÓXIMA SEMANA — 21-25 abril 2026 ────────────────────────
  await prisma.turno.create({ data: {
    pacienteId: carlos.id, inicio: ar("2026-04-22","17:00"), fin: ar("2026-04-22","17:45"),
    estado: "programado", cobrado: false, importe, modalidad: "virtual",
  }});
  await prisma.turno.create({ data: {
    pacienteId: diego.id, inicio: ar("2026-04-22","18:30"), fin: ar("2026-04-22","19:15"),
    estado: "programado", cobrado: false, importe, modalidad: "presencial",
  }});
  await prisma.turno.create({ data: {
    pacienteId: maria.id, inicio: ar("2026-04-22","14:00"), fin: ar("2026-04-22","14:45"),
    estado: "programado", cobrado: false, importe, modalidad: "presencial",
  }});
  await prisma.turno.create({ data: {
    pacienteId: lucia.id, inicio: ar("2026-04-23","15:30"), fin: ar("2026-04-23","16:15"),
    estado: "programado", cobrado: false, importe, modalidad: "virtual",
  }});
  await prisma.turno.create({ data: {
    pacienteId: isabella.id, inicio: ar("2026-04-23","17:00"), fin: ar("2026-04-23","17:45"),
    estado: "programado", cobrado: false, importe, modalidad: "presencial",
  }});
  await prisma.turno.create({ data: {
    pacienteId: valentina.id, inicio: ar("2026-04-24","14:00"), fin: ar("2026-04-24","14:45"),
    estado: "programado", cobrado: false, importe, modalidad: "virtual",
  }});
  await prisma.turno.create({ data: {
    pacienteId: agustin.id, inicio: ar("2026-04-24","16:00"), fin: ar("2026-04-24","16:45"),
    estado: "programado", cobrado: false, importe, modalidad: "presencial",
  }});
  await prisma.turno.create({ data: {
    pacienteId: martin.id, inicio: ar("2026-04-25","16:00"), fin: ar("2026-04-25","16:45"),
    estado: "programado", cobrado: false, importe, modalidad: "virtual",
  }});
  await prisma.turno.create({ data: {
    pacienteId: elena.id, inicio: ar("2026-04-25","18:00"), fin: ar("2026-04-25","18:45"),
    estado: "programado", cobrado: false, importe, modalidad: "presencial",
  }});
  await prisma.turno.create({ data: {
    pacienteId: sofia.id, inicio: ar("2026-04-25","14:00"), fin: ar("2026-04-25","14:45"),
    estado: "programado", cobrado: false, importe, modalidad: "virtual",
  }});

  console.log("✓ Turnos creados.");

  // ── 7. SESIONES con historia clínica ────────────────────────────

  // MARÍA GONZÁLEZ — TDAH
  await prisma.sesion.create({ data: {
    pacienteId: maria.id, turnoId: t_maria_1.id, fecha: ar("2026-03-10","14:00"),
    resumen: "Primera sesión del mes. María llegó activa y con buena disposición. Se trabajó con bloques de construcción y rompecabezas para evaluar atención sostenida. Se observó dificultad para mantener el foco durante más de 3-4 minutos sin estímulo externo. La madre refiere que en el colegio la docente reporta que se levanta del banco con frecuencia. Se realizó psicoeducación básica sobre el funcionamiento de la atención con la niña.",
    objetivos: "Evaluar capacidad atencional y tolerancia a la frustración. Establecer vínculo terapéutico.",
    proximosPasos: "Incorporar juegos de seguimiento de instrucciones secuenciadas. Coordinar con la madre pautas de rutina en el hogar.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: maria.id, turnoId: t_maria_2.id, fecha: ar("2026-03-24","14:00"),
    resumen: "Sesión con buena dinámica. María logró sostener la atención durante 8 minutos en actividad de armado de secuencias. Se nota progreso respecto a la sesión anterior. Trabajamos el juego del 'semáforo' para regulación de impulsos. La madre comenta que en casa la niña está más tranquila a la hora de hacer la tarea si tienen una rutina estructurada.",
    objetivos: "Fortalecer regulación de impulsos. Trabajar atención sostenida mediante juego estructurado.",
    proximosPasos: "Introducir técnicas de mindfulness adaptadas para niños en próxima sesión. Revisar con la madre el cuaderno de rutinas.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: maria.id, turnoId: t_maria_3.id, fecha: ar("2026-04-15","14:00"),
    resumen: "Sesión de seguimiento. María trajo un dibujo que hizo en el colegio sobre 'lo que le cuesta y lo que le sale bien'. Excelente ejercicio de autoconocimiento. Trabajamos a partir del dibujo la noción de esfuerzo y paciencia. Logró completar una actividad de 15 minutos con solo dos interrupciones. Se observa consolidación del vínculo terapéutico.",
    objetivos: "Profundizar en autoconocimiento. Reforzar estrategias de autorregulación.",
    proximosPasos: "Contactar a la docente para feedback escolar. Continuar con ejercicios de atención dividida.",
  }});

  // LUCÍA RAMÍREZ — TAG
  await prisma.sesion.create({ data: {
    pacienteId: lucia.id, turnoId: t_lucia_1.id, fecha: ar("2026-03-11","15:30"),
    resumen: "Lucía refiere semana con alta ansiedad anticipatoria por reunión de trabajo. Se exploraron los disparadores específicos y las cogniciones asociadas. Identifica como principal preocupación 'quedar mal delante del jefe'. Se realizó psicoeducación sobre el ciclo ansiedad-evitación. Realizamos ejercicio de respiración diafragmática que la paciente valoró positivamente.",
    objetivos: "Identificar disparadores de ansiedad. Introducir técnicas de regulación.",
    proximosPasos: "Registrar pensamientos automáticos durante la semana. Practicar respiración diafragmática 10 min/día.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: lucia.id, turnoId: t_lucia_2.id, fecha: ar("2026-03-25","15:30"),
    resumen: "Lucía trajo el registro de pensamientos. Se observan patrones claros de sobregeneralización y lectura de mente. Trabajamos reestructuración cognitiva con 3 situaciones concretas. Refiere mejora en la calidad del sueño al implementar las rutinas de higiene del sueño sugeridas la sesión anterior. Sigue con dificultad para delegar tareas en el trabajo.",
    objetivos: "Reestructuración cognitiva. Trabajar sobre perfeccionismo laboral.",
    proximosPasos: "Experimento conductual: delegar una tarea pequeña esta semana y registrar resultado real vs. temido.",
  }});

  // CARLOS FERNÁNDEZ — Depresión
  await prisma.sesion.create({ data: {
    pacienteId: carlos.id, turnoId: t_carlos_1.id, fecha: ar("2026-03-09","17:00"),
    resumen: "Carlos llega con ánimo bajo pero con mayor energía que en la sesión anterior. Refiere haber retomado las caminatas matutinas tres días de la semana. Se trabajó activación conductual, identificando actividades placenteras que abandonó durante el episodio depresivo. Se construyó lista de actividades graduadas por nivel de esfuerzo.",
    objetivos: "Consolidar activación conductual. Monitorear estado de ánimo.",
    proximosPasos: "Implementar al menos 2 actividades placenteras esta semana. Llevar registro de ánimo diario (escala 1-10).",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: carlos.id, turnoId: t_carlos_2.id, fecha: ar("2026-03-23","17:00"),
    resumen: "Revisión del registro de ánimo: semana con promedio de 5.8/10, mejoría respecto a las semanas previas. Carlos logró realizar las actividades comprometidas. Trabajamos identificación y cuestionamiento de pensamientos automáticos negativos centrados en la idea de 'ser una carga para los demás'. Se introdujo el modelo ABC cognitivo.",
    objetivos: "Reestructuración cognitiva. Trabajar creencias nucleares sobre inutilidad.",
    proximosPasos: "Registrar situación-pensamiento-emoción durante la semana. Continuar con activación conductual.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: carlos.id, turnoId: t_carlos_3.id, fecha: ar("2026-04-14","17:00"),
    resumen: "Carlos comenta que tuvo una semana difícil por una discusión con su hermano, pero logró manejarla sin caer en rumiación prolongada. Reconoce que aplica las herramientas cognitivas. El ánimo se mantiene estable en 6.5/10. Trabajamos habilidades de comunicación asertiva con role playing de la situación familiar.",
    objetivos: "Habilidades de comunicación. Prevención de recaída.",
    proximosPasos: "Practicar comunicación asertiva con el hermano. Revisar señales de alerta para el próximo encuentro.",
  }});

  // VALENTINA SOSA — Ansiedad de separación
  await prisma.sesion.create({ data: {
    pacienteId: valentina.id, turnoId: t_valentina_1.id, fecha: ar("2026-03-12","14:00"),
    resumen: "Valentina llegó aferrada a su mamá y tardó 10 minutos en ingresar al consultorio. Una vez que la madre se retiró al salón de espera, la niña se calmó progresivamente con ayuda del muñeco de transición (osito que le pertenece). Realizamos juego de roles donde el osito 'se despide' de su mamá y 'vuelve'. Al finalizar la sesión, la reunión con la madre fue positiva.",
    objetivos: "Reducir angustia en el momento de separación. Fortalecer recursos de transición.",
    proximosPasos: "Psicoeducación a los padres: evitar prolongar la despedida. Practicar ritual de despedida corto en casa.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: valentina.id, turnoId: t_valentina_2.id, fecha: ar("2026-03-26","14:00"),
    resumen: "Mejoría significativa en la separación al inicio de la sesión: Valentina entró sola al consultorio esta vez, aunque con cara de preocupación. Trabajamos cuento terapéutico sobre 'el koala que aprendió que mamá siempre vuelve'. La niña participó activamente completando el cuento. La madre refiere que durante la semana los episodios de llanto al llevarla al colegio disminuyeron de 5 días a 2 días.",
    objetivos: "Consolidar recursos de separación. Trabajar representación de permanencia del vínculo.",
    proximosPasos: "Continuar con el ritual de despedida. Incorporar elemento simbólico (foto de la familia) que Valentina pueda tener en el colegio.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: valentina.id, turnoId: t_valentina_3.id, fecha: ar("2026-04-15","16:00"),
    resumen: "Valentina entró al consultorio corriendo y saludó con entusiasmo. Gran avance vincular. Refiere que en el colegio ya no llora al separarse. Trabajamos en el refuerzo de la autonomía: actividades que 'puedo hacer sola'. Realizamos collage de logros personales. La madre está muy satisfecha con la evolución.",
    objetivos: "Consolidar autonomía. Reforzar autoconcepto positivo.",
    proximosPasos: "Evaluar espaciamiento de sesiones a quincenal. Psicoeducación familiar sobre mantenimiento de logros.",
  }});

  // MARTÍN LÓPEZ — Burnout
  await prisma.sesion.create({ data: {
    pacienteId: martin.id, turnoId: t_martin_1.id, fecha: ar("2026-03-13","16:00"),
    resumen: "Martín llegó exhausto, refiere no poder 'apagar la cabeza' al llegar a su casa. Trabaja en promedio 11 horas diarias. Identificamos señales físicas y emocionales del burnout: cefaleas tensionales 3-4 veces/semana, irritabilidad con su pareja, pérdida de motivación por actividades que antes disfrutaba. Se realizó psicoeducación sobre el síndrome de burnout y se introdujo el concepto de límites laborales.",
    objetivos: "Psicoeducación sobre burnout. Identificar factores de riesgo personales.",
    proximosPasos: "Llevar registro de horas de trabajo esta semana. Identificar una actividad de desconexión que pueda incorporar.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: martin.id, turnoId: t_martin_2.id, fecha: ar("2026-03-27","16:00"),
    resumen: "Martín registró 58 horas de trabajo en la semana. Hay dificultad real para poner límites dado el contexto de su empresa (startup). Trabajamos valores personales vs. mandatos laborales introyectados. Identificó que su autoestima está fuertemente ligada a la productividad. Comenzamos a cuestionar la ecuación 'valor personal = rendimiento laboral'.",
    objetivos: "Trabajar creencias sobre productividad y valor personal. Comenzar a diseñar límites laborales.",
    proximosPasos: "Probar desconectarse del teléfono laboral después de las 21hs durante 3 días esta semana. Registrar qué emociones aparecen.",
  }});

  // SOFÍA TORRES — Autoestima
  await prisma.sesion.create({ data: {
    pacienteId: sofia.id, turnoId: t_sofia_1.id, fecha: ar("2026-03-14","14:00"),
    resumen: "Sofía llegó callada y con actitud defensiva inicial. Con el tiempo fue abriéndose. Refirió un episodio de exclusión social: un grupo de compañeras no la incluyó en un plan de cumpleaños. Trabajamos identificación de emociones asociadas: tristeza, vergüenza, rabia. Exploramos la narrativa que construyó alrededor del episodio: 'nadie me quiere, soy aburrida'. Se cuestionó evidencia a favor y en contra.",
    objetivos: "Explorar episodio de exclusión social. Identificar distorsiones cognitivas asociadas.",
    proximosPasos: "Solicitar a Sofía que registre 3 evidencias de que sí tiene vínculos positivos durante la semana.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: sofia.id, turnoId: t_sofia_2.id, fecha: ar("2026-03-28","14:00"),
    resumen: "Sofía trajo el registro de evidencias positivas y pudo identificar 5 situaciones donde sus amigas la buscaron o la incluyeron. Reconoció la distorsión del filtro negativo que aplica habitualmente. Trabajamos autocompasión con ejercicio de 'la amiga imaginaria': ¿qué le dirías a una amiga que se siente así? Le resultó poderoso. Se nota mayor reflexividad.",
    objetivos: "Fortalecer autocompasión. Reducir filtro negativo.",
    proximosPasos: "Practicar ejercicio de la 'amiga imaginaria' cuando aparezcan pensamientos autocríticos. Explorar actividades en las que se sienta competente.",
  }});

  // DIEGO MARTÍNEZ — Duelo
  await prisma.sesion.create({ data: {
    pacienteId: diego.id, turnoId: t_diego_1.id, fecha: ar("2026-03-09","18:30"),
    resumen: "Segunda sesión con Diego. Continúa procesando la ruptura de su relación de 6 años. Refiere momentos de tristeza profunda alternados con rabia hacia su expareja. Identifica que el mayor dolor está en la pérdida del 'proyecto de vida compartido' más que en la persona concreta. Trabajamos la distinción entre duelo por el vínculo y duelo por los planes futuros.",
    objetivos: "Elaborar narrativa del duelo. Distinguir distintos objetos de pérdida.",
    proximosPasos: "Escribir carta (que no enviará) sobre lo que perdió y lo que aprendió. Traerla a la próxima sesión.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: diego.id, turnoId: t_diego_2.id, fecha: ar("2026-03-23","18:30"),
    resumen: "Diego trajo la carta escrita. Fue un ejercicio muy movilizador. Al leerla en sesión lloró por primera vez desde que inició el proceso. Señal positiva de apertura emocional. La carta reveló sentimientos ambivalentes: enojo por cómo terminó la relación y gratitud por lo vivido. Trabajamos la ambivalencia emocional como parte normal del duelo.",
    objetivos: "Facilitar expresión emocional. Trabajar ambivalencia en el duelo.",
    proximosPasos: "Identificar actividades o proyectos propios (no de pareja) que desee retomar o iniciar.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: diego.id, turnoId: t_diego_3.id, fecha: ar("2026-04-14","18:30"),
    resumen: "Diego llegó con mejor ánimo. Retomó clases de fotografía que había dejado durante la relación. Lo vive como un reencuentro consigo mismo. Trabajamos la reinvestidura: la energía emocional que se pone en nuevos vínculos y proyectos. Se observa una fase más activa del proceso de duelo. Ya no evita salir con amigos.",
    objetivos: "Consolidar reinvestidura. Fortalecer identidad personal post-duelo.",
    proximosPasos: "Continuar con fotografía. Reflexionar sobre aprendizajes de la relación para llevar a futuros vínculos.",
  }});

  // ISABELLA ROMERO — Enuresis y ansiedad escolar
  await prisma.sesion.create({ data: {
    pacienteId: isabella.id, turnoId: t_isabella_1.id, fecha: ar("2026-03-11","17:00"),
    resumen: "Primera sesión con Isabella. Llegó tímida pero curiosa. La madre comenta que los episodios de enuresis nocturna ocurren principalmente los domingos a la noche y previo a exámenes. Se exploró con la niña su experiencia escolar mediante dibujo. Dibujó el colegio con una figura pequeña (ella) lejos de otras figuras (compañeros). Posible componente de aislamiento social.",
    objetivos: "Evaluar ansiedad escolar. Explorar contexto vincular en el colegio.",
    proximosPasos: "Trabajar la relación entre las emociones y el cuerpo en próxima sesión. Coordinación con la madre para registro de episodios y contextos.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: isabella.id, turnoId: t_isabella_2.id, fecha: ar("2026-03-25","17:00"),
    resumen: "Trabajamos la conexión emoción-cuerpo con el ejercicio del 'termómetro emocional'. Isabella identificó que siente 'bichos en la panza' (ansiedad) los domingos a la noche y que eso se relaciona con pensar en el colegio del lunes. Se introdujo técnica de respiración con globo imaginario. La madre registró que los episodios de enuresis bajaron de 4 a 2 veces en las últimas dos semanas.",
    objetivos: "Psicoeducación emocional adaptada a la edad. Vincular ansiedad y manifestación somática.",
    proximosPasos: "Practicar el termómetro emocional en casa los domingos. Explorar qué aspectos del colegio generan mayor ansiedad.",
  }});

  // AGUSTÍN HERRERA — Trastorno de pánico
  await prisma.sesion.create({ data: {
    pacienteId: agustin.id, turnoId: t_agustin_1.id, fecha: ar("2026-03-12","16:00"),
    resumen: "Agustín describe el último episodio de pánico: estaba en el subte cuando sintió taquicardia, sensación de irrealidad y miedo a 'volverse loco'. Evita el subte desde hace 3 semanas y redujo sus salidas. Se realizó psicoeducación completa sobre la anatomía del pánico: respuesta fight-or-flight, hiperventilación, sensaciones físicas. La desmitificación del síntoma tuvo buena recepción.",
    objetivos: "Psicoeducación sobre el trastorno de pánico. Reducir la sensación de peligro asociada a las sensaciones físicas.",
    proximosPasos: "Llevar registro de episodios con intensidad, contexto y duración. Practicar respiración lenta 4-4-4.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: agustin.id, turnoId: t_agustin_2.id, fecha: ar("2026-03-26","16:00"),
    resumen: "Agustín registró dos episodios de menor intensidad (6/10 vs. 9/10 previos) y menor duración. Atribuye la mejoría a reconocer las sensaciones como 'el cuerpo activado, no un infarto'. Comenzamos exposición interoceptiva suave: girar en silla para provocar mareo leve. Agustín lo toleró bien con algo de incomodidad. Excelente actitud hacia el tratamiento.",
    objetivos: "Iniciar exposición interoceptiva. Consolidar modelo cognitivo del pánico.",
    proximosPasos: "Practicar ejercicios de exposición interoceptiva en casa (girar, respiración rápida controlada). Jerarquía de situaciones evitadas.",
  }});

  // ELENA DÍAZ — Duelo crónico
  await prisma.sesion.create({ data: {
    pacienteId: elena.id, turnoId: t_elena_1.id, fecha: ar("2026-03-13","18:00"),
    resumen: "Elena habló extensamente sobre su marido fallecido hace 4 años. Refiere que los primeros dos años lloró mucho pero que ahora siente una tristeza 'seca', sin lágrimas, y una sensación de que 'su vida se detuvo' mientras el mundo siguió. Se explora la reorganización de identidad: ella siempre se definió como 'la mujer de Héctor'. Ahora no sabe quién es. Primera sesión con apertura emocional significativa.",
    objetivos: "Explorar duelo crónico y dificultad de reorganización identitaria.",
    proximosPasos: "Reflexionar sobre roles e intereses propios previos al matrimonio. Traer foto de cuando era joven.",
  }});
  await prisma.sesion.create({ data: {
    pacienteId: elena.id, turnoId: t_elena_2.id, fecha: ar("2026-03-27","18:00"),
    resumen: "Elena trajo fotos de cuando tenía 30 años. Había una donde estaba pintando acuarelas. Recordó con nostalgia y algo de emoción que le encantaba pintar y que lo abandonó 'porque a Héctor no le interesaba y me daba vergüenza'. Trabajamos el reencuentro con aspectos del self previos a la identidad conyugal. Elena mostró interés genuino en retomar la pintura.",
    objetivos: "Reencuentro con identidad previa. Facilitar reinvestidura de actividades propias.",
    proximosPasos: "Comprarse materiales de acuarela esta semana. No importa el resultado, solo el proceso.",
  }});

  console.log("✓ Sesiones con historia clínica creadas.");

  const totalTurnos = await prisma.turno.count();
  const totalSesiones = await prisma.sesion.count();
  console.log(`\n✓ Reseed completo:`);
  console.log(`  ${totalTurnos} turnos`);
  console.log(`  ${totalSesiones} sesiones con notas clínicas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
