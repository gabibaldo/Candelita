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

export async function createMeetEvent(
  accessToken: string,
  refreshToken: string,
  tokenExpiry: Date | null,
  {
    summary,
    start,
    end,
    description,
  }: { summary: string; start: Date; end: Date; description?: string }
) {
  const auth = getOAuthClient();
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenExpiry?.getTime(),
  });

  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: { dateTime: start.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
      end: { dateTime: end.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
      conferenceData: {
        createRequest: {
          requestId: `candelita-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const event = res.data;
  const meetLink = event.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video"
  )?.uri ?? null;

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
