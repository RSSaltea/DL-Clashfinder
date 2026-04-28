import type { FestivalExport } from "../types";
import { parseFestivalExport } from "./import";

const tableName = "group_plans";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "") ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export type GroupSyncStatus = "disabled" | "idle" | "syncing" | "synced" | "error";

export interface GroupSyncState {
  configured: boolean;
  status: GroupSyncStatus;
  message: string;
  lastSyncedAt?: string;
  memberCount: number;
}

interface GroupPlanRow {
  group_code: string;
  member_id: string;
  profile_name: string;
  payload: unknown;
  updated_at: string;
}

export const isGroupSyncConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const normaliseGroupCode = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "-");

const getHeaders = (contentType = false) => {
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
  if (response.ok) {
    return;
  }

  const body = await response.text();
  throw new Error(body || fallbackMessage);
};

const getEndpoint = (path = "") => `${supabaseUrl}/rest/v1/${tableName}${path}`;

export const pushGroupPlan = async (
  groupCode: string,
  memberId: string,
  payload: FestivalExport,
) => {
  if (!isGroupSyncConfigured()) {
    throw new Error("Group sync is not configured.");
  }

  const normalisedGroupCode = normaliseGroupCode(groupCode);

  if (!normalisedGroupCode) {
    throw new Error("Enter a group code before syncing.");
  }

  const response = await fetch(getEndpoint("?on_conflict=group_code,member_id"), {
    method: "POST",
    headers: {
      ...getHeaders(true),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        group_code: normalisedGroupCode,
        member_id: memberId,
        profile_name: payload.profileName,
        payload: {
          ...payload,
          groupCode: normalisedGroupCode,
        },
        updated_at: new Date().toISOString(),
      },
    ]),
  });

  await checkResponse(response, "Could not save this group plan.");
};

export const pullGroupPlans = async (groupCode: string, memberId: string): Promise<FestivalExport[]> => {
  if (!isGroupSyncConfigured()) {
    throw new Error("Group sync is not configured.");
  }

  const normalisedGroupCode = normaliseGroupCode(groupCode);

  if (!normalisedGroupCode) {
    return [];
  }

  const params = new URLSearchParams({
    select: "group_code,member_id,profile_name,payload,updated_at",
    group_code: `eq.${normalisedGroupCode}`,
    order: "updated_at.desc",
  });

  const response = await fetch(getEndpoint(`?${params.toString()}`), {
    headers: getHeaders(),
  });

  await checkResponse(response, "Could not load group plans.");

  const rows = (await response.json()) as GroupPlanRow[];

  return rows
    .filter((row) => row.member_id !== memberId)
    .map((row) => {
      const payload = parseFestivalExport(row.payload, row.profile_name || "Synced plan");

      return {
        ...payload,
        groupCode: payload.groupCode ?? row.group_code,
      };
    });
};
