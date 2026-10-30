import React, { useEffect, useRef, useState } from "react";
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

function CommentCard({ comment, reply = false, onLike, onReply, onReport, busyId }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  async function submitReport(event) {
    event.preventDefault();
    setReportMessage("");
    try {
      await onReport(comment.id, reason, details);
      setReportOpen(false);
      setDetails("");
      setReportMessage("Report sent to the moderation team.");
    } catch (error) {
      setReportMessage(error.message || "Report could not be submitted.");
    }
  }

  return (
    <article className={`commentItem${reply ? " commentReply" : ""}`}>
      <div className="commentHead">
        <b>{comment.username}</b>
        <span className="muted">{comment.created_at}</span>
      </div>
      <p>{comment.body}</p>
      <div className="commentActions">
        <button className="ghost commentLike" type="button" disabled={busyId === comment.id} aria-pressed={Boolean(comment.liked)} onClick={() => onLike(comment.id)}>
          {comment.liked ? "♥" : "♡"} {Number(comment.likes || 0)}
        </button>
        <button className="ghost commentReplyBtn" type="button" onClick={() => onReply(comment)}>Reply</button>
        <button className="ghost commentReport" type="button" aria-expanded={reportOpen} onClick={() => setReportOpen(value => !value)}>
          {reportOpen ? "Cancel report" : "Report"}
        </button>
      </div>
      {reportOpen && (
        <form className="commentReportForm" onSubmit={submitReport}>
          <label>Reason
            <select value={reason} onChange={event => setReason(event.target.value)}>
              <option value="spam">Spam or advertising</option>
              <option value="harassment">Harassment or abuse</option>
              <option value="copyright">Copyright concern</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Additional details
            <textarea value={details} maxLength={500} rows={2} onChange={event => setDetails(event.target.value)} placeholder="Optional context for moderators" />
          </label>
          <button className="secondary" type="submit">Submit report</button>
        </form>
      )}
      {reportMessage && <p className="commentStatus" role="status">{reportMessage}</p>}
    </article>
  );
}

function NovelComments({ novelId }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef(null);

  async function refresh() {
    const rows = await request(`/api/comments?novel_id=${encodeURIComponent(novelId)}`);
    setComments(Array.isArray(rows) ? rows : []);
  }

  useEffect(() => {
    let active = true;
    request(`/api/comments?novel_id=${encodeURIComponent(novelId)}`)
      .then(rows => { if (active) setComments(Array.isArray(rows) ? rows : []); })
      .catch(cause => { if (active) setError(cause.message || "Community comments are temporarily unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [novelId]);

  async function requireAccount() {
    const account = await request("/api/me");
    if (!account.user) {
      window.location.assign("/login");
      return false;
    }
    return true;
  }

  async function submitComment(event) {
    event.preventDefault();
    const text = body.trim();
    if (!text) { setError("Write a comment before posting."); return; }
    if (text.length > 1000) { setError("Comments are limited to 1,000 characters."); return; }
    setPosting(true);
    setError("");
    setNotice("");
    try {
      if (!(await requireAccount())) return;
      await request("/api/comments", {
        method: "POST",
        body: JSON.stringify({ novel_id: novelId, body: text, parent_id: replyTo?.id || 0 }),
      });
      setBody("");
      setReplyTo(null);
      await refresh();
      setNotice("Your comment has been posted.");
    } catch (cause) {
      setError(cause.message || "Your comment could not be posted.");
    } finally {
      setPosting(false);
    }
  }

  async function likeComment(commentId) {
    if (busyId) return;
    setBusyId(commentId);
    setError("");
    try {
      if (!(await requireAccount())) return;
      const result = await request("/api/comments/like", {
        method: "POST",
        body: JSON.stringify({ comment_id: commentId }),
      });
      setComments(rows => rows.map(row => row.id === commentId ? { ...row, liked: result.liked, likes: result.likes } : row));
    } catch (cause) {
      setError(cause.message || "The reaction could not be saved.");
    } finally {
      setBusyId(null);
    }
  }

  async function reportComment(commentId, reason, details) {
    if (!(await requireAccount())) throw new Error("Sign in to report a comment.");
    await request("/api/comments/report", {
      method: "POST",
      body: JSON.stringify({ comment_id: commentId, reason, details }),
    });
  }

  function replyToComment(comment) {
    setReplyTo(comment);
    setNotice("");
    inputRef.current?.focus();
  }

  const byParent = new Map();
  for (const comment of comments) {
    const parent = Number(comment.parent_id || 0);
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(comment);
  }
  const topLevel = byParent.get(0) || [];

  return (
    <div className="novelComments">
      <form className="novelCommentsComposer" onSubmit={submitComment}>
        {replyTo && (
          <div className="replyContext">
            <span>Replying to <b>{replyTo.username}</b></span>
            <button type="button" className="ghost" onClick={() => setReplyTo(null)}>Cancel reply</button>
          </div>
        )}
        <label className="srOnly" htmlFor="novelCommentBody">Your comment</label>
        <textarea
          id="novelCommentBody"
          ref={inputRef}
          value={body}
          maxLength={1000}
          rows={4}
          onChange={event => setBody(event.target.value)}
          placeholder={replyTo ? `Reply to ${replyTo.username}…` : "Share your thoughts about this story…"}
        />
        <div className="novelCommentComposerFooter">
          <span className="muted">{body.length}/1,000 characters</span>
          <button className="primary" type="submit" disabled={posting}>{posting ? "Posting…" : "Post Comment"}</button>
        </div>
      </form>
      {error && <p className="commentStatus" role="alert">{error}</p>}
      {notice && <p className="commentStatus" role="status">{notice}</p>}
      <div className="novelCommentsList" aria-live="polite">
        {loading && <div className="empty" role="status">Loading the discussion…</div>}
        {!loading && !error && comments.length === 0 && <div className="empty">No comments yet. Be the first reader to start the conversation.</div>}
        {!loading && topLevel.map(comment => (
          <React.Fragment key={comment.id}>
            <CommentCard comment={comment} onLike={likeComment} onReply={replyToComment} onReport={reportComment} busyId={busyId} />
            {(byParent.get(Number(comment.id)) || []).map(reply => (
              <CommentCard key={reply.id} comment={reply} reply onLike={likeComment} onReply={replyToComment} onReport={reportComment} busyId={busyId} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function mountNovelComments(element, novelId) {
  const id = Number(novelId);
  if (!(element instanceof Element) || !Number.isSafeInteger(id) || id < 1) return false;
  if (element.__imperialCommentsRoot) return true;
  element.__imperialCommentsRoot = createRoot(element);
  element.__imperialCommentsRoot.render(<NovelComments novelId={id} />);
  return true;
}
