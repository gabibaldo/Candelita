import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.sesion.deleteMany();
  await prisma.archivo.deleteMany();
  await prisma.bloqueoDia.deleteMany();
  await prisma.turno.deleteMany();
  await prisma.paciente.deleteMany();
  console.log("✓ Base de datos limpia. El usuario de Cande se mantiene.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
