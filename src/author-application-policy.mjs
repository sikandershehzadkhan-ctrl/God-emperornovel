const AUTHORABLE_FORMATS = new Set([
  "original", "fanfiction", "light_novel", "web_novel",
  "manga", "manhwa", "manhua", "webtoon", "comic", "graphic_novel",
]);

export function validateAuthorApplication(input = {}) {
  const displayName = String(input.display_name || "").trim();
  const bio = String(input.bio || "").trim();
  const experience = String(input.experience || "").trim();
  const portfolioUrl = String(input.portfolio_url || "").trim();
  const sampleWork = String(input.sample_work || "").trim();
  const rawFormats = Array.isArray(input.preferred_formats)
    ? input.preferred_formats
    : typeof input.preferred_formats === "string"
      ? input.preferred_formats.split(",")
      : [];
  const preferredFormats = [...new Set(rawFormats.map(value => String(value).trim().toLowerCase()).filter(Boolean))];

  if (displayName.length < 2 || displayName.length > 80) {
    return { ok: false, error: "Display name must be between 2 and 80 characters." };
  }
  if (bio.length < 50 || bio.length > 1500) {
    return { ok: false, error: "Tell us about yourself in 50 to 1,500 characters." };
  }
  if (experience.length > 1000) {
    return { ok: false, error: "Experience notes must be 1,000 characters or fewer." };
  }
  if (sampleWork.length < 250 || sampleWork.length > 6000) {
    return { ok: false, error: "Your original or authorized writing sample must be between 250 and 6,000 characters." };
  }
  if (!preferredFormats.length || preferredFormats.length > 5 || preferredFormats.some(format => !AUTHORABLE_FORMATS.has(format))) {
    return { ok: false, error: "Choose between 1 and 5 supported writing or comics formats." };
  }
  if (input.rights_confirmed !== true) {
    return { ok: false, error: "Confirm that you own the sample or have permission to submit it." };
  }
  if (portfolioUrl) {
    try {
      const url = new URL(portfolioUrl);
      if (url.protocol !== "https:" || !url.hostname || url.username || url.password) throw new Error("invalid");
    } catch {
      return { ok: false, error: "Portfolio link must be a valid HTTPS URL." };
    }
  }

  return {
    ok: true,
    value: {
      display_name: displayName,
      bio,
      experience,
      portfolio_url: portfolioUrl,
      sample_work: sampleWork,
      preferred_formats: preferredFormats,
      rights_confirmed: true,
    },
  };
}

export function validateAuthorApplicationDecision(input = {}) {
  const status = String(input.status || input.decision || "").trim().toLowerCase();
  const reviewNotes = String(input.review_notes || "").trim();
  if (!["approved", "rejected"].includes(status)) {
    return { ok: false, error: "Decision must be approved or rejected." };
  }
  if (reviewNotes.length > 1500) {
    return { ok: false, error: "Review notes must be 1,500 characters or fewer." };
  }
  if (status === "rejected" && reviewNotes.length < 10) {
    return { ok: false, error: "Give the applicant clear feedback of at least 10 characters." };
  }
  return { ok: true, value: { status, review_notes: reviewNotes } };
}
