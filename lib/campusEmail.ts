export function getAllowedCampusDomains(): string[] {
  const raw = process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAINS ?? "";
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedCampusEmail(email: string): boolean {
  const allowed = getAllowedCampusDomains();
  if (!allowed.length) return true; // no restriction configured yet

  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;

  return allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
}