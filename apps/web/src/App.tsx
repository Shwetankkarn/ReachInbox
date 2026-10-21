
import { useCallback, useEffect, useState, type FormEvent } from "react";
import "./App.css";
import ThemeToggle from "./components/ThemeToggle";

const API_URL = "http://localhost:3000/api/emails";
const AUTH_URL = "http://localhost:3000/auth";

type Email = {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: string;
  sentAt: string | null;
};

type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

type Tab = "SCHEDULED" | "SENT";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("SCHEDULED");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompose, setShowCompose] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      setAuthError("");

      const response = await fetch(`${AUTH_URL}/me`, {
        credentials: "include",
      });

      if (response.status === 401) {
        setUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to check login session.");
      }

      const data = await response.json();
      setUser(data.user ?? null);
    } catch {
      setAuthError("Unable to check login session. Is the backend running?");
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loadEmails = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(API_URL, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to load emails.");
      }

      const data = await response.json();
      setEmails(Array.isArray(data.emails) ? data.emails : []);
    } catch {
      setError(
        "Cannot load emails. Check that the backend is running on port 3000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
    void loadEmails();

    const params = new URLSearchParams(window.location.search);
    const loginResult = params.get("login");

    if (loginResult === "success") {
      void loadUser();
    } else if (loginResult === "failed") {
      setAuthError("Google login failed. Please try again.");
    }

    if (loginResult) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadUser, loadEmails]);

  async function handleLogout() {
    setLoggingOut(true);
    setAuthError("");

    try {
      const response = await fetch(`${AUTH_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      setUser(null);
      setShowCompose(false);
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      setAuthError("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  function startGoogleLogin() {
    window.location.href = `${AUTH_URL}/google`;
  }

  const filteredEmails = emails.filter(
    (email) => email.status === activeTab
  );

  const scheduledCount = emails.filter(
    (email) => email.status === "SCHEDULED"
  ).length;

  const sentCount = emails.filter(
    (email) => email.status === "SENT"
  ).length;

  const userInitial = (user?.name || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <span>ReachInbox</span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <div className="workspace">
          <div className="workspace-avatar">
            {userInitial}
          </div>
          <div>
            <strong>
              {user ? `${user.name}'s Workspace` : "Demo Workspace"}
            </strong>
            <small>{user ? "Personal workspace" : "Free workspace"}</small>
          </div>
          <span className="workspace-arrow">⌄</span>
        </div>

        <div className="nav-label">EMAIL</div>

        <button
          className={`nav-item ${activeTab === "SCHEDULED" ? "active" : ""}`}
          onClick={() => setActiveTab("SCHEDULED")}
        >
          <span>◷</span> Scheduled
          <span className="nav-count">{scheduledCount}</span>
        </button>

        <button
          className={`nav-item ${activeTab === "SENT" ? "active" : ""}`}
          onClick={() => setActiveTab("SENT")}
        >
          <span>↗</span> Sent
          <span className="nav-count">{sentCount}</span>
        </button>

        <div className="sidebar-bottom">
          <div className="profile-avatar">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            ) : (
              userInitial
            )}
          </div>

          <div className="profile-info">
            <strong>{user?.name || "Guest User"}</strong>
            <small>{user?.email || "Not logged in"}</small>
          </div>

          {user && (
            <button
              className="more-button"
              title="Log out"
              aria-label="Log out"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? "…" : "↪"}
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
       
<header className="topbar">
  <div>
    <div className="breadcrumb">Workspace / Email</div>
    <h1 className="text-3xl font-bold text-purple-600">
      Email Scheduler
    </h1>
  </div>

  <div className="topbar-actions">
    <ThemeToggle />

    {authLoading ? (
      <button className="secondary-button" disabled>
        Checking login...
      </button>
    ) : user ? (
      <button
        className="secondary-button"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
      >
        {loggingOut ? "Logging out..." : "Log out"}
      </button>
    ) : (
      <button
        className="secondary-button"
        onClick={startGoogleLogin}
      >
        Continue with Google
      </button>
    )}

    <button
      className="primary-button"
      onClick={() => {
        if (!user) {
          setAuthError(
            "Please sign in with Google before composing emails."
          );
          return;
        }

        setAuthError("");
        setShowCompose(true);
      }}
    >
      <span>＋</span> Compose email
    </button>
  </div>
</header>


        {authError && (
          <div className="error-message" role="alert">
            {authError}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-heading">
              Scheduled emails <span>◷</span>
            </div>
            <div className="stat-value">{scheduledCount}</div>
            <div className="stat-description">Waiting to be sent</div>
          </div>

          <div className="stat-card">
            <div className="stat-heading">
              Sent emails <span>↗</span>
            </div>
            <div className="stat-value">{sentCount}</div>
            <div className="stat-description">Successfully processed</div>
          </div>

          <div className="stat-card">
            <div className="stat-heading">
              Total emails <span>✉</span>
            </div>
            <div className="stat-value">{emails.length}</div>
            <div className="stat-description">In your workspace</div>
          </div>
        </section>

        <section className="email-panel">
          <div className="panel-header">
            <div>
              <h2>Your emails</h2>
              <p>Manage and track your scheduled email delivery.</p>
            </div>

            <button
              className="secondary-button"
              onClick={() => void loadEmails()}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="tabs">
            <button
              className={activeTab === "SCHEDULED" ? "tab active-tab" : "tab"}
              onClick={() => setActiveTab("SCHEDULED")}
            >
              Scheduled <span>{scheduledCount}</span>
            </button>

            <button
              className={activeTab === "SENT" ? "tab active-tab" : "tab"}
              onClick={() => setActiveTab("SENT")}
            >
              Sent <span>{sentCount}</span>
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="empty-state">Loading emails...</div>
          ) : filteredEmails.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✉</div>
              <h3>No {activeTab.toLowerCase()} emails yet</h3>
              <p>
                Your emails will appear here when they are scheduled or sent.
              </p>

              <button
                className="primary-button"
                onClick={() => {
                  if (!user) {
                    setAuthError("Please sign in with Google before composing emails.");
                    return;
                  }

                  setAuthError("");
                  setShowCompose(true);
                }}
              >
                Compose your first email
              </button>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>RECIPIENT</th>
                    <th>SUBJECT</th>
                    <th>STATUS</th>
                    <th>
                      {activeTab === "SENT" ? "SENT AT" : "SCHEDULED FOR"}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmails.map((email) => (
                    <tr key={email.id}>
                      <td>
                        <div className="recipient-cell">
                          <div className="recipient-avatar">
                            {email.recipientEmail.charAt(0).toUpperCase()}
                          </div>
                          {email.recipientEmail}
                        </div>
                      </td>

                      <td>
                        <strong className="subject-text">
                          {email.subject}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-pill ${email.status.toLowerCase()}`}
                        >
                          <span className="status-dot" />
                          {email.status}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          activeTab === "SENT" && email.sentAt
                            ? email.sentAt
                            : email.scheduledAt
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>ReachInbox Email Scheduler</span>
          <span>Powered by BullMQ · PostgreSQL</span>
        </footer>
      </main>

      {showCompose && user && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onScheduled={async () => {
            setShowCompose(false);
            setActiveTab("SCHEDULED");
            await loadEmails();
          }}
        />
      )}
    </div>
  );
}

function ComposeModal({
  onClose,
  onScheduled,
}: {
  onClose: () => void;
  onScheduled: () => Promise<void>;
}) {
  const [recipientText, setRecipientText] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [delaySeconds, setDelaySeconds] = useState("5");
const [hourlyLimit, setHourlyLimit] = useState("100");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const emailPattern =
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/g;

  function getValidEmails(text: string) {
    const matches = text.match(emailPattern) ?? [];
    return [...new Set(matches.map((email) => email.toLowerCase()))];
  }

  const validEmails = getValidEmails(recipientText);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "csv" && extension !== "txt") {
      setMessage("Please upload a CSV or TXT file.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      setRecipientText((previous) =>
        [previous, text].filter(Boolean).join("\n")
      );
      setMessage("");
    } catch {
      setMessage("Unable to read this file.");
    }

    event.target.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (validEmails.length === 0) {
      setMessage("Enter at least one valid email address.");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setMessage("Subject and email body are required.");
      return;
    }

    if (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now()) {
      setMessage("Please select a future date and time.");
      return;
    }

    setSending(true);

    try {
      const baseTime = new Date(scheduledAt).getTime();

      for (let index = 0; index < validEmails.length; index++) {
        const recipient = validEmails[index];
        const recipientScheduledAt = new Date(
          baseTime + index * Number(delaySeconds) * 1000
        );

        const response = await fetch(`${API_URL}/schedule`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient,
            subject: subject.trim(),
            body: body.trim(),
            scheduledAt: recipientScheduledAt.toISOString(),
delaySeconds: Number(delaySeconds),
hourlyLimit: Number(hourlyLimit),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            `Could not schedule ${recipient}: ${
              data.message || "Request failed"
            }. Some earlier recipients may already be scheduled.`
          );
        }
      }

      await onScheduled();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSending(false);
    }
  }

  const minDateTime = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="compose-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Compose email</h2>
            <p>Upload recipients and choose when to send.</p>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close compose form"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="compose-form">
          <label>
            Recipients
            <textarea
              value={recipientText}
              onChange={(event) => setRecipientText(event.target.value)}
              placeholder={"name@example.com\nanother@example.com"}
              rows={3}
              required
            />
          </label>

          <label>
            Upload recipients (CSV or TXT)
            <input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={handleFileChange}
            />
          </label>

          <p className="recipient-count">
            Valid unique email addresses: <strong>{validEmails.length}</strong>
          </p>

          <label>
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Enter email subject"
              maxLength={200}
              required
            />
          </label>

          <label>
            Email body
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write your message..."
              rows={4}
              required
            />
          </label>

          <label>
            Schedule date and time
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              min={minDateTime}
              required
            />
          </label>

        
<label>
  Delay between emails (seconds)
  <input
    type="number"
    min={1}
    value={delaySeconds}
    onChange={(event) => setDelaySeconds(event.target.value)}
    onBlur={() => {
      const value = Number(delaySeconds);
      setDelaySeconds(String(Math.max(1, value || 1)));
    }}
    required
  />
</label>




<label>
  Maximum emails per hour
  <input
    type="number"
    min={1}
    max={100}
    value={hourlyLimit}
    onChange={(event) => setHourlyLimit(event.target.value)}
    onBlur={() => {
      const value = Number(hourlyLimit);
      setHourlyLimit(String(Math.min(100, Math.max(1, value || 1))));
    }}
    required
  />
</label>



          <p className="form-hint">
            Emails are scheduled one by one. The delay sets the spacing between
            their scheduled times.
          </p>

          {message && <div className="error-message">{message}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={sending || validEmails.length === 0}
            >
              {sending
                ? "Scheduling..."
                : `Schedule ${validEmails.length} email(s)`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default App;
