import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function RatingIsland({ novelId }) {
  const [rating, setRating] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    request(`/api/rating?novel_id=${encodeURIComponent(novelId)}`)
      .then(result => { if (active) setRating(result); })
      .catch(cause => { if (active) setError(cause.message || "Rating is temporarily unavailable."); });
    return () => { active = false; };
  }, [novelId]);

  async function choose(value) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const account = await request("/api/me");
      if (!account.user) {
        window.location.assign("/login");
        return;
      }
      const result = await request("/api/rating", {
        method: "POST",
        body: JSON.stringify({ novel_id: novelId, rating: value }),
      });
      setRating(previous => ({ ...previous, ...result, user_rating: value }));
      const summary = document.querySelector("#novelRating");
      if (summary) summary.textContent = Number(result.average || 0).toFixed(1);
    } catch (cause) {
      setError(cause.message || "Your rating could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!rating) return <div className="ratingIsland"><div className="muted" role="status">{error || "Loading rating…"}</div></div>;

  const average = Number(rating.average || 0);
  const count = Number(rating.count || 0);
  const selected = Number(rating.user_rating || 0);

  return (
    <div className="ratingIsland">
      <div className="ratingStars" role="group" aria-label="Rate this novel">
        {[1, 2, 3, 4, 5].map(value => (
          <button
            key={value}
            className={`ratingStar${value <= selected ? " selected" : ""}`}
            type="button"
            disabled={busy}
            aria-label={`Rate ${value} out of 5`}
            aria-pressed={selected === value}
            onClick={() => choose(value)}
          >
            ★
          </button>
        ))}
      </div>
      <p className="ratingIslandSummary" aria-live="polite">
        <strong>{average.toFixed(1)} / 5</strong>
        <span> · {count.toLocaleString()} {count === 1 ? "rating" : "ratings"}</span>
        {selected > 0 && <span> · Your rating: {selected}/5</span>}
      </p>
      {error && <p className="commentStatus" role="alert">{error}</p>}
    </div>
  );
}

export function mountNovelRating(element, novelId) {
  const id = Number(novelId);
  if (!(element instanceof Element) || !Number.isSafeInteger(id) || id < 1) return false;
  if (element.__imperialRatingRoot) return true;
  element.__imperialRatingRoot = createRoot(element);
  element.__imperialRatingRoot.render(<RatingIsland novelId={id} />);
  return true;
}
