import { LogIn, LogOut, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { AccountSession } from "../types";
import type { ResetAnswer } from "../utils/accountSync";
import { resetQuestions } from "../utils/accountSync";

type AuthMode = "login" | "register" | "reset";

interface AuthDialogProps {
  account: AccountSession | null;
  configured: boolean;
  profileName: string;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string, profileName: string, answers: ResetAnswer[]) => Promise<void>;
  onLogout: () => void;
  onLoadResetQuestions: (username: string) => Promise<string[]>;
  onResetPassword: (username: string, answers: ResetAnswer[], newPassword: string) => Promise<void>;
}

const getQuestionLabel = (id: string) =>
  resetQuestions.find((question) => question.id === id)?.label ?? id;

export const AuthDialog = ({
  account,
  configured,
  profileName,
  onLogin,
  onRegister,
  onLogout,
  onLoadResetQuestions,
  onResetPassword,
}: AuthDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState(profileName);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resetQuestionIds, setResetQuestionIds] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedAnswers = useMemo<ResetAnswer[]>(
    () =>
      Object.entries(answers)
        .map(([questionId, answer]) => ({ questionId, answer: answer.trim() }))
        .filter((answer) => answer.answer),
    [answers],
  );

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setAnswers({});
    setResetQuestionIds([]);
    setNewPassword("");
    setMessage("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetForm();
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage("");

    try {
      await action();
      setOpen(false);
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That did not work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = () =>
    run(async () => {
      if (!username.trim() || !password) {
        throw new Error("Enter your username and password.");
      }

      await onLogin(username, password);
    });

  const submitRegister = () =>
    run(async () => {
      if (!username.trim() || password.length < 8) {
        throw new Error("Use a username and a password of at least 8 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("The passwords do not match.");
      }

      if (selectedAnswers.length < 2) {
        throw new Error("Pick and answer at least two reset questions.");
      }

      await onRegister(username, password, registerName || profileName || "Me", selectedAnswers);
    });

  const loadResetQuestions = async () => {
    setBusy(true);
    setMessage("");

    try {
      const questionIds = await onLoadResetQuestions(username);
      setResetQuestionIds(questionIds);
      setAnswers({});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load reset questions.");
    } finally {
      setBusy(false);
    }
  };

  const submitReset = () =>
    run(async () => {
      if (resetQuestionIds.length === 0) {
        throw new Error("Load your reset questions first.");
      }

      if (newPassword.length < 8) {
        throw new Error("Use a new password of at least 8 characters.");
      }

      await onResetPassword(username, selectedAnswers, newPassword);
    });

  const modal = open ? (
    <div className="modal-backdrop" role="presentation">
      <section className="auth-modal" role="dialog" aria-modal="true" aria-label="Account">
        <button className="icon-button auth-close" type="button" onClick={() => setOpen(false)} aria-label="Close">
          <X size={18} />
        </button>

        {account ? (
          <>
            <p className="eyebrow">Account</p>
            <h2>Signed in as {account.username}</h2>
            <p className="muted">Your picks, group codes and clash votes sync to this account.</p>
            <button
              className="secondary-button fit-content"
              type="button"
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
            >
              <LogOut size={18} />
              Log out
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow">Account sync</p>
            <h2>{mode === "register" ? "Create account" : mode === "reset" ? "Reset password" : "Log in"}</h2>

            {!configured && (
              <p className="error-banner">Account tables are not ready in Supabase yet. Run the SQL file first.</p>
            )}

            {message && <p className="error-banner">{message}</p>}

            <div className="auth-tabs">
              <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => switchMode("login")}>
                Login
              </button>
              <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => switchMode("register")}>
                Register
              </button>
              <button type="button" className={mode === "reset" ? "is-active" : ""} onClick={() => switchMode("reset")}>
                Reset
              </button>
            </div>

            <label className="form-field">
              Username
              <input value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>

            {mode === "login" && (
              <>
                <label className="form-field">
                  Password
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </label>
                <button className="primary-button" type="button" disabled={!configured || busy} onClick={submitLogin}>
                  <LogIn size={18} />
                  {busy ? "Logging in..." : "Login"}
                </button>
              </>
            )}

            {mode === "register" && (
              <>
                <label className="form-field">
                  Compare display name
                  <input value={registerName} onChange={(event) => setRegisterName(event.target.value)} />
                </label>
                <label className="form-field">
                  Password
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </label>
                <label className="form-field">
                  Confirm password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>

                <div className="reset-question-list">
                  {resetQuestions.map((question) => (
                    <label className="reset-question" key={question.id}>
                      <span>{question.label}</span>
                      <input
                        placeholder="Answer"
                        value={answers[question.id] ?? ""}
                        onChange={(event) => setAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))}
                      />
                    </label>
                  ))}
                </div>

                <button className="primary-button" type="button" disabled={!configured || busy} onClick={submitRegister}>
                  {busy ? "Creating..." : "Create account"}
                </button>
              </>
            )}

            {mode === "reset" && (
              <>
                <button className="secondary-button fit-content" type="button" disabled={!configured || busy} onClick={loadResetQuestions}>
                  Load reset questions
                </button>
                {resetQuestionIds.length > 0 && (
                  <>
                    <div className="reset-question-list">
                      {resetQuestionIds.map((questionId) => (
                        <label className="reset-question" key={questionId}>
                          <span>{getQuestionLabel(questionId)}</span>
                          <input
                            placeholder="Answer"
                            value={answers[questionId] ?? ""}
                            onChange={(event) => setAnswers((current) => ({
                              ...current,
                              [questionId]: event.target.value,
                            }))}
                          />
                        </label>
                      ))}
                    </div>
                    <label className="form-field">
                      New password
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                      />
                    </label>
                    <button className="primary-button" type="button" disabled={busy} onClick={submitReset}>
                      {busy ? "Resetting..." : "Reset password"}
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  ) : null;

  return (
    <>
      <button className="secondary-button account-button" type="button" onClick={() => setOpen(true)}>
        <UserRound size={18} />
        {account ? account.username : "Login"}
      </button>

      {modal ? createPortal(modal, document.body) : null}
    </>
  );
};
