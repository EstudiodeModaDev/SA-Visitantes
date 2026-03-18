import * as React from "react";
import { useGraphServices } from "../graph/graphContext";
import type { OfficeGroupMember, OfficeUserOption } from "../models/officeGroups";
import { normalizeUser } from "../utils/users";
import type { GraphUserLite } from "../graph/graphRest";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

export function useOfficeGroupMembers(groupId?: string) {
  const graph = useGraphServices();

  const [members, setMembers] = React.useState<OfficeGroupMember[]>([]);
  const [searchResults, setSearchResults] = React.useState<OfficeUserOption[]>([]);

  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [searchingUsers, setSearchingUsers] = React.useState(false);
  const [addingUserId, setAddingUserId] = React.useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = React.useState<string | null>(null);

  const [error, setError] = React.useState<string | null>(null);

  const memberIds = React.useMemo(
    () => new Set(members.map((m) => m.id.toLowerCase())),
    [members]
  );

  const loadMembers = React.useCallback(async () => {
    if (!groupId) {
      setMembers([]);
      return;
    }

    setLoadingMembers(true);
    setError(null);

    try {
      const res = await graph.graph.get<{ value: GraphUserLite[] }>( `/groups/${groupId}/members?$select=id,displayName,mail,userPrincipalName&$top=999`);
      const rows = Array.isArray(res?.value) ? res.value : [];
      setMembers(rows.map(normalizeUser).filter((x) => !!x.id));
    } catch (e) {
      setError(getErrorMessage(e));
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [graph, groupId]);

  const searchUsers = React.useCallback(
    async (term: string) => {
      const q = term.trim();

      if (!q) {
        setSearchResults([]);
        return;
      }

      setSearchingUsers(true);
      setError(null);

      try {
        const escaped = q.replace(/"/g, '\\"');

        const query = encodeURIComponent(
          `"displayName:${escaped}" OR "mail:${escaped}" OR "userPrincipalName:${escaped}"`
        );

        const res = await graph.graph.get<{ value: GraphUserLite[] }>(
          `/users?$search=${query}&$select=id,displayName,mail,userPrincipalName,jobTitle&$top=20`,
          {
            headers: {
              ConsistencyLevel: "eventual",
            },
          }
        );

        const rows = Array.isArray(res?.value) ? res.value : [];
        setSearchResults(rows.map(normalizeUser).filter((x) => !!x.id));
      } catch (e) {
        setError(getErrorMessage(e));
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    },
    [graph]
  );

  const addMember = React.useCallback(
    async (userId: string) => {
      if (!groupId || !userId) return;
      setAddingUserId(userId);
      setError(null);

      try {
      await graph.graph.post(`/groups/${groupId}/members/$ref`, {
        "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`,
      });

        await loadMembers();

        // opcional: limpiar resultados de búsqueda del ya agregado
        setSearchResults((prev) =>
          prev.filter((u) => u.id.toLowerCase() !== userId.toLowerCase())
        );
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setAddingUserId(null);
      }
    },
    [graph, groupId, loadMembers]
  );

  const removeMember = React.useCallback(
    async (userId: string) => {
      if (!groupId || !userId) return;
      setRemovingUserId(userId);
      setError(null);

      try {
        // DELETE /groups/{id}/members/{id}/$ref
        await graph.graph.delete(`/groups/${groupId}/members/${userId}/$ref`);
        setMembers((prev) => prev.filter((m) => m.id.toLowerCase() !== userId.toLowerCase()));
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setRemovingUserId(null);
      }
    },
    [graph, groupId]
  );

  React.useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  return {
    members, searchResults, loadingMembers, searchingUsers, addingUserId, removingUserId, error, memberIds,
    loadMembers, searchUsers, addMember, removeMember, clearSearchResults: () => setSearchResults([]),
  };
}