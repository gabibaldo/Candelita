-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "telefono" TEXT,
    "titulo" TEXT,
    "matricula" TEXT,
    "especialidad" TEXT,
    "domicilioProfesional" TEXT,
    "cuit" TEXT,
    "razonSocial" TEXT,
    "condicionAfip" TEXT,
    "domicilioFiscal" TEXT,
    "cbu" TEXT,
    "aliasBank" TEXT,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "tutorNombre" TEXT,
    "tutorTelefono" TEXT,
    "tutorDni" TEXT,
    "tutorRelacion" TEXT,
    "tipo" TEXT NOT NULL,
    "obraSocialNombre" TEXT,
    "numeroAfiliado" TEXT,
    "sesionesAutorizadas" INTEGER,
    "importeSesion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "motivoConsulta" TEXT,
    "diagnostico" TEXT,
    "objetivosTerapeuticos" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notasGenerales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'programado',
    "modalidad" TEXT NOT NULL DEFAULT 'presencial',
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "importe" DOUBLE PRECISION,
    "cobrado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "meetLink" TEXT,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "turnoId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL,
    "resumen" TEXT NOT NULL,
    "objetivos" TEXT,
    "proximosPasos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Paciente_apellido_nombre_idx" ON "Paciente"("apellido", "nombre");

-- CreateIndex
CREATE INDEX "Turno_inicio_idx" ON "Turno"("inicio");

-- CreateIndex
CREATE INDEX "Turno_pacienteId_idx" ON "Turno"("pacienteId");

-- CreateIndex
CREATE INDEX "Archivo_pacienteId_idx" ON "Archivo"("pacienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_turnoId_key" ON "Sesion"("turnoId");

-- CreateIndex
CREATE INDEX "Sesion_pacienteId_fecha_idx" ON "Sesion"("pacienteId", "fecha");

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivo" ADD CONSTRAINT "Archivo_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
