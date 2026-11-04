const PROFILE_KEYS = new Set(["display_name","bio","avatar_url","website_url","location","profile_visibility","show_reading_stats"]);
const cleanText = (value, max, field) => {
  if (typeof value !== "string") return { error: field + " must be text." };
  const text = value.normalize("NFC").trim();
  if (text.length > max) return { error: field + " must be " + max + " characters or fewer." };
  if (/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]/u.test(text)) return { error: field + " contains unsupported control characters." };
  return { value: text };
};
const safeAvatar = value => {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\\\") && !/(?:^|\\/)\\.\\.(?:\\/|$)/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !!url.hostname && !url.username && !url.password; } catch { return false; }
};
const safeWebsite = value => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !!url.hostname && !url.username && !url.password; } catch { return false; }
};
export function validateUserProfile(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "A profile object is required." };
  for (const key of Object.keys(input)) if (!PROFILE_KEYS.has(key)) return { ok: false, error: "Unsupported profile field: " + key };
  const value = {};
  for (const [key,max,label] of [["display_name",40,"Display name"],["bio",500,"Biography"],["avatar_url",500,"Avatar URL"],["website_url",200,"Website URL"],["location",80,"Location"]]) {
    const checked = cleanText(input[key] ?? "", max, label);
    if (checked.error) return { ok: false, error: checked.error };
    value[key] = checked.value;
  }
  if (value.display_name && value.display_name.length < 2) return { ok: false, error: "Display name must contain at least 2 characters." };
  if (!safeAvatar(value.avatar_url)) return { ok: false, error: "Avatar must use HTTPS or a safe same-origin path." };
  if (!safeWebsite(value.website_url)) return { ok: false, error: "Website must be a valid HTTPS URL." };
  if (!["public","private"].includes(input.profile_visibility)) return { ok: false, error: "Choose public or private profile visibility." };
  if (typeof input.show_reading_stats !== "boolean") return { ok: false, error: "Reading-stat visibility must be true or false." };
  value.profile_visibility = input.profile_visibility;
  value.show_reading_stats = input.show_reading_stats ? 1 : 0;
  return { ok: true, value };
}
