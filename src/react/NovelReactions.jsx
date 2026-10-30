import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const REACTIONS = [
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "laugh", emoji: "😂", label: "Funny" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "clap", emoji: "👏", label: "Applause" },
];

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function ReactionIsland({ novelId }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    request(`/api/novel-reactions?novel_id=${encodeURIComponent(novelId)}`)
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError("Reactions are temporarily unavailable."); });
    return () => { active = false; };
  }, [novelId]);

  async function react(reaction) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const account = await request("/api/me");
      if (!account.user) {
        window.location.assign("/login");
        return;
      }
      const result = await request("/api/novel-reactions", {
        method: "POST",
        body: JSON.stringify({ novel_id: novelId, reaction }),
      });
      setData(result);
    } catch (cause) {
      setError(cause.message || "Your reaction could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <span className="muted" role="status">{error || "Loading reactions…"}</span>;

  return (
    <div className="reactReactionList" aria-label="Reader reactions">
      {REACTIONS.map(({ id, emoji, label }) => {
        const selected = data.user_reaction === id;
        return (
          <button
            key={id}
            type="button"
            className={`secondary novelReaction${selected ? " selected" : ""}`}
            aria-label={`${label}: ${Number(data.counts?.[id] || 0)} reactions`}
            aria-pressed={selected}
            title={label}
            disabled={busy}
            onClick={() => react(id)}
          >
            <span aria-hidden="true">{emoji}</span>
            <span>{Number(data.counts?.[id] || 0)}</span>
          </button>
        );
      })}
      {error && <span className="reactReactionError" role="status">{error}</span>}
    </div>
  );
}

export function mountNovelReactions(element, novelId) {
  const id = Number(novelId);
  if (!(element instanceof Element) || !Number.isSafeInteger(id) || id < 1) return false;
  if (element.__imperialReactRoot) return true;
  element.__imperialReactRoot = createRoot(element);
  element.__imperialReactRoot.render(<ReactionIsland novelId={id} />);
  return true;
}
