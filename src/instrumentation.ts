export async function register() {
  // En Vercel el cron se maneja vía /api/cron/recordatorio + vercel.json
  // En desarrollo local, activar node-cron descomentando:
  // if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "development") {
  //   const { startCron } = await import("./lib/cron");
  //   startCron();
  // }
}
