import type { FestivalExport, GroupMemberRole } from "../types";
import { parseFestivalExport } from "./import";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "") ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export type { GroupMemberRole };

export interface GroupMemberInfo {
  memberId: string;
  profileName: string;
  role: GroupMemberRole;
  isMe: boolean;
}

export type GroupSyncStatus = "disabled" | "idle" | "syncing" | "synced" | "error";

export interface GroupSyncState {
  configured: boolean;
  status: GroupSyncStatus;
  message: string;
  lastSyncedAt?: string;
  memberCount: number;
}

export interface PullResult {
  plans: FestivalExport[];
  members: GroupMemberInfo[];
  myRole: GroupMemberRole;
}

interface GroupPlanRow {
  member_id: string;
  profile_name: string;
  payload: unknown;
  role: GroupMemberRole;
  updated_at: string;
  is_me: boolean;
}

export const isGroupSyncConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const normaliseGroupCode = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "-");

const getHeaders = (contentType = false): Record<string, string> => {
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const checkResponse = async (response: Response, fallbackMessage: string) => {
  if (response.ok) return;
  const body = await response.text();
  throw new Error(body || fallbackMessage);
};

const rpc = async <T>(functionName: string, body: Record<string, unknown>): Promise<T> => {
  if (!isGroupSyncConfigured()) {
    throw new Error("Group sync is not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify(body),
  });

  await checkResponse(response, `${functionName} failed.`);

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const pushGroupPlan = async (
  groupCode: string,
  memberId: string,
  payload: FestivalExport,
): Promise<{ role: GroupMemberRole }> => {
  if (!isGroupSyncConfigured()) {
    throw new Error("Group sync is not configured.");
  }

  const normalisedGroupCode = normaliseGroupCode(groupCode);

  if (!normalisedGroupCode) {
    throw new Error("Enter a group code before syncing.");
  }

  return rpc<{ role: GroupMemberRole }>("dl_push_group_plan", {
    group_code_input: normalisedGroupCode,
    member_id_input: memberId,
    profile_name_input: payload.profileName,
    payload_input: { ...payload, groupCode: normalisedGroupCode },
  });
};

export const pullGroupPlans = async (
  groupCode: string,
  memberId: string,
): Promise<PullResult> => {
  if (!isGroupSyncConfigured()) {
    throw new Error("Group sync is not configured.");
  }

  const normalisedGroupCode = normaliseGroupCode(groupCode);

  if (!normalisedGroupCode) {
    return { plans: [], members: [], myRole: "member" };
  }

  const rows = await rpc<GroupPlanRow[]>("dl_pull_group_plans", {
    group_code_input: normalisedGroupCode,
    member_id_input: memberId,
  });

  const members: GroupMemberInfo[] = rows.map((row) => ({
    memberId: row.member_id,
    profileName: row.profile_name,
    role: row.role,
    isMe: row.is_me,
  }));

  const myRow = rows.find((row) => row.is_me);
  const myRole: GroupMemberRole = myRow?.role ?? "member";

  const plans = rows
    .filter((row) => !row.is_me)
    .map((row) => ({
      ...parseFestivalExport(row.payload, row.profile_name || "Synced plan"),
      groupCode: normalisedGroupCode,
      groupRole: row.role,
    }));

  return { plans, members, myRole };
};

export const removeGroupMember = async (
  groupCode: string,
  memberIdToRemove: string,
  requesterMemberId: string,
): Promise<void> => {
  await rpc<{ ok: boolean }>("dl_remove_group_member", {
    group_code_input: normaliseGroupCode(groupCode),
    member_id_to_remove: memberIdToRemove,
    requester_member_id: requesterMemberId,
  });
};

export const setGroupMemberRole = async (
  groupCode: string,
  targetMemberId: string,
  newRole: "admin" | "member",
  requesterMemberId: string,
): Promise<void> => {
  await rpc<{ ok: boolean }>("dl_set_group_role", {
    group_code_input: normaliseGroupCode(groupCode),
    target_member_id: targetMemberId,
    new_role_input: newRole,
    requester_member_id: requesterMemberId,
  });
};
