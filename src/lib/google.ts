import { google } from "googleapis";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/google/callback`
  );
}

export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
}

// Colores de Google Calendar:
//   "2" = Sage (verde)    → turnos presenciales
//   "3" = Grape (violeta) → turnos virtuales
const COLOR_PRESENCIAL = "2";
const COLOR_VIRTUAL    = "3";

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  tokenExpiry: Date | null,
  {
    summary,
    start,
    end,
    description,
    modalidad,
  }: {
    summary: string;
    start: Date;
    end: Date;
    description?: string;
    modalidad: "presencial" | "virtual";
  }
): Promise<{ googleEventId: string | null; meetLink: string | null }> {
  const auth = getOAuthClient();
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenExpiry?.getTime(),
  });

  const calendar = google.calendar({ version: "v3", auth });
  const isVirtual = modalidad === "virtual";

  const res = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: isVirtual ? 1 : 0,
    requestBody: {
      summary,
      description,
      colorId: isVirtual ? COLOR_VIRTUAL : COLOR_PRESENCIAL,
      start: { dateTime: start.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
      end:   { dateTime: end.toISOString(),   timeZone: "America/Argentina/Buenos_Aires" },
      ...(isVirtual && {
        conferenceData: {
          createRequest: {
            requestId: `candelita-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  });

  const event = res.data;
  const meetLink = isVirtual
    ? (event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ?? null)
    : null;

  return { googleEventId: event.id ?? null, meetLink };
}

export async function deleteMeetEvent(
  accessToken: string,
  refreshToken: string,
  tokenExpiry: Date | null,
  googleEventId: string
) {
  const auth = getOAuthClient();
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenExpiry?.getTime(),
  });
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId: googleEventId }).catch(() => {});
}
