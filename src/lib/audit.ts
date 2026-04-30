import { prisma } from "@/lib/db";

type AuditAction =
  | "login_ok"
  | "login_fail"
  | "export"
  | "file_upload"
  | "file_delete"
  | "pwd_change"
  | "pwd_reset";

export async function auditLog(params: {
  usuarioId: number;
  action: AuditAction;
  resourceType?: string;
  resourceId?: number;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // No romper el flujo principal si el log falla
  }
}
