import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AccountPlan,
  AccountSession,
  ClashDecisionMap,
  FestivalExport,
  GroupClashVoteMap,
  Intent,
  IntentMap,
  SetTimeMap,
} from "../types";
import {
  type ResetAnswer,
  getAccountResetQuestions,
  isAccountSyncConfigured,
  loadAccountPlan,
  loginAccount,
  registerAccount,
  resetAccountPassword,
  saveAccountPlan,
} from "../utils/accountSync";
import { createExportPayload } from "../utils/export";
import {
  type GroupMemberInfo,
  type GroupMemberRole,
  type GroupSyncState,
  isGroupSyncConfigured,
  normaliseGroupCode,
  pullGroupPlans,
  pushGroupPlan,
  removeGroupMember as removeGroupMemberRpc,
  setGroupMemberRole as setGroupMemberRoleRpc,
} from "../utils/groupSync";
import {
  getNextIntent,
  loadAccountSession,
  loadClashDecisions,
  loadGroupCode,
  loadGroupCodes,
  loadGroupClashVotes,
  loadGroupClashVotesByCode,
  loadGroupMemberId,
  loadImports,
  loadIntentMap,
  loadProfileName,
  saveAccountSession,
  saveClashDecisions,
  saveGroupCode,
  saveGroupCodes,
  saveGroupClashVotes,
  saveGroupClashVotesByCode,
  saveImports,
  saveIntentMap,
  saveProfileName,
} from "../utils/localStorage";

const getInitialGroupSyncState = (): GroupSyncState => {
  const configured = isGroupSyncConfigured();

  return {
    configured,
    status: configured ? "idle" : "disabled",
    message: configured
      ? "Enter a group code and your picks will sync automatically."
      : "Group sync is not configured yet. Add Supabase details to enable shared group codes.",
    memberCount: 1,
  };
};

const emptyAccountPlan = (profileName = "Me"): AccountPlan => ({
  version: 1,
  profileName,
  intents: {},
  imports: [],
  clashDecisions: {},
  groupClashVotesByCode: {},
  groupCode: "",
  groupCodes: [],
});

const hasAccountPlanContent = (plan: AccountPlan | null | undefined) =>
  Boolean(plan && (
    Object.keys(plan.intents).length > 0 ||
    plan.imports.length > 0 ||
    Object.keys(plan.clashDecisions).length > 0 ||
    Object.keys(plan.groupClashVotesByCode).length > 0 ||
    plan.groupCodes.length > 0 ||
    plan.groupCode
  ));

const mergeAccountPlans = (remotePlan: AccountPlan | null, localPlan: AccountPlan): AccountPlan => {
  const remote = remotePlan ?? emptyAccountPlan(localPlan.profileName);

  return {
    version: 1,
    profileName: localPlan.profileName || remote.profileName || "Me",
    intents: {
      ...remote.intents,
      ...localPlan.intents,
    },
    imports: localPlan.imports.length > 0 ? localPlan.imports : remote.imports,
    clashDecisions: {
      ...remote.clashDecisions,
      ...localPlan.clashDecisions,
    },
    groupClashVotesByCode: {
      ...remote.groupClashVotesByCode,
      ...localPlan.groupClashVotesByCode,
    },
    groupCode: localPlan.groupCode || remote.groupCode || "",
    groupCodes: Array.from(new Set([
      ...remote.groupCodes,
      ...localPlan.groupCodes,
      remote.groupCode,
      localPlan.groupCode,
    ].filter(Boolean))),
  };
};

export const useFestivalState = () => {
  const [intents, setIntents] = useState<IntentMap>(() => loadIntentMap());
  const [profileName, setProfileNameState] = useState(() => loadProfileName());
  const [imports, setImportsState] = useState<FestivalExport[]>(() => loadImports());
  const [syncedImports, setSyncedImports] = useState<FestivalExport[]>([]);
  const [clashDecisions, setClashDecisions] = useState<ClashDecisionMap>(() => loadClashDecisions());
  const [account, setAccount] = useState<AccountSession | null>(() => loadAccountSession());
  const [accountReady, setAccountReady] = useState(() => !loadAccountSession());
  const [groupCode, setGroupCodeState] = useState(() => loadGroupCode());
  const [groupCodeDraft, setGroupCodeDraftState] = useState(() => loadGroupCode());
  const [groupCodes, setGroupCodes] = useState<string[]>(() => loadGroupCodes(loadGroupCode()));
  const [groupClashVotesByCode, setGroupClashVotesByCode] = useState<GroupClashVoteMap>(() =>
    loadGroupClashVotesByCode(loadGroupCode(), loadGroupClashVotes()),
  );
  const [groupSyncState, setGroupSyncState] = useState<GroupSyncState>(() => getInitialGroupSyncState());
  const [groupMembers, setGroupMembers] = useState<GroupMemberInfo[]>([]);
  const [myGroupRole, setMyGroupRole] = useState<GroupMemberRole>("member");
  const groupMemberId = useMemo(() => loadGroupMemberId(), []);
  const activeMemberId = account?.userId ?? groupMemberId;
  const syncConfigured = useMemo(() => isGroupSyncConfigured(), []);
  const accountConfigured = useMemo(() => isAccountSyncConfigured(), []);
  const activeGroupCodeRef = useRef(normaliseGroupCode(groupCode));
  const setTimes = useMemo<SetTimeMap>(() => ({}), []);
  const groupClashVotes = useMemo(
    () => (groupCode ? groupClashVotesByCode[groupCode] ?? {} : {}),
    [groupClashVotesByCode, groupCode],
  );

  const getLocalAccountPlan = useCallback((): AccountPlan => ({
    version: 1,
    profileName,
    intents,
    imports,
    clashDecisions,
    groupClashVotesByCode,
    groupCode,
    groupCodes,
  }), [clashDecisions, groupClashVotesByCode, groupCode, groupCodes, imports, intents, profileName]);

  const applyAccountPlan = useCallback((plan: AccountPlan) => {
    setProfileNameState(plan.profileName || "Me");
    setIntents(plan.intents ?? {});
    setImportsState(plan.imports ?? []);
    setClashDecisions(plan.clashDecisions ?? {});
    setGroupClashVotesByCode(plan.groupClashVotesByCode ?? {});
    setGroupCodeState(plan.groupCode ?? "");
    setGroupCodeDraftState(plan.groupCode ?? "");
    setGroupCodes(plan.groupCodes ?? []);
    setSyncedImports([]);
  }, []);

  const completeAccountSignIn = useCallback(async (
    session: AccountSession,
    remotePlan: AccountPlan | null,
  ) => {
    const localPlan = getLocalAccountPlan();
    const nextPlan = hasAccountPlanContent(localPlan)
      ? mergeAccountPlans(remotePlan, localPlan)
      : remotePlan ?? localPlan;

    setAccount(session);
    setAccountReady(true);
    saveAccountSession(session);
    applyAccountPlan(nextPlan);
    await saveAccountPlan(session.token, nextPlan);
  }, [applyAccountPlan, getLocalAccountPlan]);

  const loginFestivalAccount = useCallback(async (username: string, password: string) => {
    const result = await loginAccount(username, password);
    await completeAccountSignIn(result.session, result.plan);
  }, [completeAccountSignIn]);

  const registerFestivalAccount = useCallback(async (
    username: string,
    password: string,
    displayName: string,
    answers: ResetAnswer[],
  ) => {
    const result = await registerAccount(username, password, displayName, answers);
    await completeAccountSignIn(result.session, result.plan);
  }, [completeAccountSignIn]);

  const logoutFestivalAccount = useCallback(() => {
    setAccount(null);
    setAccountReady(true);
    saveAccountSession(null);
  }, []);

  const resetFestivalAccountPassword = useCallback(async (
    username: string,
    answers: ResetAnswer[],
    newPassword: string,
  ) => {
    await resetAccountPassword(username, answers, newPassword);
  }, []);

  useEffect(() => {
    activeGroupCodeRef.current = normaliseGroupCode(groupCode);
  }, [groupCode]);

  useEffect(() => {
    saveIntentMap(intents);
  }, [intents]);

  useEffect(() => {
    saveProfileName(profileName);
  }, [profileName]);

  useEffect(() => {
    saveImports(imports);
  }, [imports]);

  useEffect(() => {
    saveClashDecisions(clashDecisions);
  }, [clashDecisions]);

  useEffect(() => {
    saveGroupClashVotesByCode(groupClashVotesByCode);
    saveGroupClashVotes(groupClashVotes);
  }, [groupClashVotes, groupClashVotesByCode]);

  useEffect(() => {
    saveGroupCode(groupCode);
  }, [groupCode]);

  useEffect(() => {
    saveGroupCodes(groupCodes);
  }, [groupCodes]);

  useEffect(() => {
    if (!account) {
      setAccountReady(true);
      return;
    }

    let cancelled = false;

    const hydrateAccount = async () => {
      try {
        const remotePlan = await loadAccountPlan(account.token);

        if (cancelled) {
          return;
        }

        const localPlan = getLocalAccountPlan();
        const nextPlan = hasAccountPlanContent(localPlan)
          ? mergeAccountPlans(remotePlan, localPlan)
          : remotePlan ?? localPlan;

        applyAccountPlan(nextPlan);
        await saveAccountPlan(account.token, nextPlan);
      } catch (error) {
        if (!cancelled) {
          const msg = error instanceof Error ? error.message : "";
          const sessionExpired = msg.toLowerCase().includes("session expired") || msg.toLowerCase().includes("log in again");
          if (sessionExpired) {
            setAccount(null);
            saveAccountSession(null);
          }
          // On network errors keep the session — user stays logged in with local data
        }
      } finally {
        if (!cancelled) {
          setAccountReady(true);
        }
      }
    };

    if (!accountReady) {
      void hydrateAccount();
    }

    return () => {
      cancelled = true;
    };
  }, [account, accountReady, applyAccountPlan, getLocalAccountPlan]);

  useEffect(() => {
    if (!account || !accountReady) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void saveAccountPlan(account.token, getLocalAccountPlan()).catch(() => undefined);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [account, accountReady, getLocalAccountPlan]);

  const selectedArtistIds = useMemo(() => new Set(Object.keys(intents)), [intents]);

  const setArtistIntent = (artistId: string, requested: Intent) => {
    setIntents((current) => {
      const nextIntent = getNextIntent(current[artistId], requested);
      const next = { ...current };

      if (nextIntent) {
        next[artistId] = nextIntent;
      } else {
        delete next[artistId];
      }

      return next;
    });
  };

  const addImports = (newImports: FestivalExport[]) => {
    setImportsState((current) => [...current, ...newImports]);
  };

  const removeImport = (index: number) => {
    setImportsState((current) => current.filter((_, i) => i !== index));
  };

  const setClashDecision = (clashId: string, artistId: string | undefined) => {
    setClashDecisions((current) => {
      const next = { ...current };

      if (artistId) {
        next[clashId] = artistId;
      } else {
        delete next[clashId];
      }

      return next;
    });
  };

  const setGroupClashVote = (clashId: string, artistId: string | undefined) => {
    if (!groupCode) {
      return;
    }

    setGroupClashVotesByCode((current) => {
      const nextVotes = { ...(current[groupCode] ?? {}) };

      if (artistId) {
        nextVotes[clashId] = artistId;
      } else {
        delete nextVotes[clashId];
      }

      return {
        ...current,
        [groupCode]: nextVotes,
      };
    });
  };

  const setGroupCodeDraft = (value: string) => {
    setGroupCodeDraftState(normaliseGroupCode(value));
  };

  const rememberGroupCode = (value: string) => {
    if (!value) {
      return;
    }

    setGroupCodes((current) => [value, ...current.filter((code) => code !== value)]);
  };

  const activateGroupCode = (value: string) => {
    const nextGroupCode = normaliseGroupCode(value);

    setGroupCodeDraftState(nextGroupCode);
    setSyncedImports([]);
    setGroupMembers([]);
    setGroupCodeState(nextGroupCode);
    activeGroupCodeRef.current = nextGroupCode;
    rememberGroupCode(nextGroupCode);

    return nextGroupCode;
  };

  const syncGroupNow = useCallback(async (requestedGroupCode?: string) => {
    const currentGroupCode = requestedGroupCode === undefined
      ? normaliseGroupCode(groupCode)
      : activateGroupCode(requestedGroupCode);

    if (!currentGroupCode) {
      setSyncedImports([]);
      setGroupSyncState({
        configured: syncConfigured,
        status: syncConfigured ? "idle" : "disabled",
        message: syncConfigured
          ? "Enter a group code and your picks will sync automatically."
          : "Group sync is not configured yet. Add Supabase details to enable shared group codes.",
        memberCount: 1,
      });
      return;
    }

    if (!syncConfigured) {
      setSyncedImports([]);
      setGroupSyncState({
        configured: false,
        status: "disabled",
        message: "Group sync is not configured yet. Add Supabase details to enable shared group codes.",
        memberCount: 1,
      });
      return;
    }

    setGroupSyncState((current) => ({
      ...current,
      configured: true,
      status: "syncing",
      message: `Syncing ${currentGroupCode}...`,
    }));

    try {
      const votesForGroup = groupClashVotesByCode[currentGroupCode] ?? {};
      const payload = createExportPayload(
        profileName,
        intents,
        setTimes,
        clashDecisions,
        currentGroupCode,
        votesForGroup,
        account?.username ?? "",
      );

      await pushGroupPlan(currentGroupCode, activeMemberId, payload);

      const pullResult = await pullGroupPlans(currentGroupCode, activeMemberId);

      if (activeGroupCodeRef.current !== currentGroupCode) {
        return;
      }

      const syncedAt = new Date().toISOString();
      const otherCount = pullResult.plans.length;
      setSyncedImports(pullResult.plans);
      setGroupMembers(pullResult.members);
      setMyGroupRole(pullResult.myRole);
      setGroupSyncState({
        configured: true,
        status: "synced",
        message: otherCount === 0
          ? `Synced ${currentGroupCode}. Waiting for other people to join.`
          : `Synced ${currentGroupCode} with ${otherCount} other ${otherCount === 1 ? "person" : "people"}.`,
        lastSyncedAt: syncedAt,
        memberCount: pullResult.members.length,
      });
    } catch (error) {
      if (activeGroupCodeRef.current !== currentGroupCode) {
        return;
      }

      setGroupSyncState({
        configured: true,
        status: "error",
        message: error instanceof Error ? error.message : "Group sync failed.",
        memberCount: syncedImports.length + 1,
      });
    }
  }, [
    clashDecisions,
    account?.username,
    groupCode,
    groupClashVotesByCode,
    activeMemberId,
    intents,
    profileName,
    setTimes,
    syncConfigured,
    syncedImports.length,
  ]);

  const removeGroupMember = useCallback(async (memberIdToRemove: string) => {
    await removeGroupMemberRpc(groupCode, memberIdToRemove, activeMemberId);
    await syncGroupNow();
  }, [groupCode, activeMemberId, syncGroupNow]);

  const setGroupMemberRole = useCallback(async (targetMemberId: string, newRole: "admin" | "member") => {
    await setGroupMemberRoleRpc(groupCode, targetMemberId, newRole, activeMemberId);
    await syncGroupNow();
  }, [groupCode, activeMemberId, syncGroupNow]);

  useEffect(() => {
    const currentGroupCode = normaliseGroupCode(groupCode);

    if (!currentGroupCode || !syncConfigured) {
      void syncGroupNow();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncGroupNow();
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [groupCode, syncConfigured, syncGroupNow]);

  useEffect(() => {
    if (!normaliseGroupCode(groupCode) || !syncConfigured) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void syncGroupNow();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [groupCode, syncConfigured, syncGroupNow]);

  return {
    intents,
    clashDecisions,
    groupClashVotes,
    groupMembers,
    myGroupRole,
    activeMemberId,
    selectedArtistIds,
    setClashDecision,
    setGroupClashVote,
    setArtistIntent,
    setIntents,
    setProfileName: setProfileNameState,
    setTimes,
    profileName,
    groupCode,
    groupCodeDraft,
    setGroupCodeDraft,
    groupCodes,
    activateGroupCode,
    syncedImports,
    groupSyncState,
    syncGroupNow,
    removeGroupMember,
    setGroupMemberRole,
    imports,
    addImports,
    removeImport,
    account,
    accountConfigured,
    loginFestivalAccount,
    registerFestivalAccount,
    logoutFestivalAccount,
    getAccountResetQuestions,
    resetFestivalAccountPassword,
  };
};
