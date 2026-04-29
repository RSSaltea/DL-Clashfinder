import type { AccountPlan, AccountSession } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "") ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const resetQuestions = [
  { id: "first_festival", label: "What was the first festival you attended?" },
  { id: "favourite_headliner", label: "Who is your favourite festival headliner?" },
  { id: "birth_city", label: "What city were you born in?" },
  { id: "childhood_friend", label: "What is the first name of your childhood best friend?" },
  { id: "teacher_name", label: "What is the surname of a memorable teacher?" },
  { id: "first_band", label: "What was the first band you saw live?" },
];

export interface ResetAnswer {
  questionId: string;
  answer: string;
}

export interface AccountAuthResult {
  session: AccountSession;
  plan: AccountPlan | null;
}

export const isAccountSyncConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

const getHeaders = () => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  "Content-Type": "application/json",
});

const rpc = async <T>(functionName: string, body: Record<string, unknown>): Promise<T> => {
  if (!isAccountSyncConfigured()) {
    throw new Error("Account sync is not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Supabase account request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const parseAuthResult = (value: AccountAuthResult): AccountAuthResult => ({
  session: {
    userId: value.session.userId,
    username: value.session.username,
    token: value.session.token,
  },
  plan: value.plan ?? null,
});

export const registerAccount = async (
  username: string,
  password: string,
  profileName: string,
  answers: ResetAnswer[],
) =>
  parseAuthResult(await rpc<AccountAuthResult>("dl_register_account", {
    username_input: username,
    password_input: password,
    profile_name_input: profileName,
    reset_answers_input: answers,
  }));

export const loginAccount = async (username: string, password: string) =>
  parseAuthResult(await rpc<AccountAuthResult>("dl_login_account", {
    username_input: username,
    password_input: password,
  }));

export const saveAccountPlan = async (token: string, plan: AccountPlan) =>
  rpc<{ ok: boolean }>("dl_save_account_plan", {
    session_token_input: token,
    payload_input: plan,
  });

export const loadAccountPlan = async (token: string) =>
  rpc<AccountPlan | null>("dl_get_account_plan", {
    session_token_input: token,
  });

export const getAccountResetQuestions = async (username: string) =>
  rpc<string[]>("dl_get_reset_questions", {
    username_input: username,
  });

export const resetAccountPassword = async (
  username: string,
  answers: ResetAnswer[],
  newPassword: string,
) =>
  rpc<{ ok: boolean }>("dl_reset_account_password", {
    username_input: username,
    reset_answers_input: answers,
    new_password_input: newPassword,
  });
