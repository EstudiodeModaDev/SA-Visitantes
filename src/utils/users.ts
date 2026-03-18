import type { GraphUserLike, OfficeGroupMember } from "../models/officeGroups";

export function normalizeUser(u: GraphUserLike): OfficeGroupMember {
  return {
    id: String(u.id ?? ""),
    displayName: String(u.displayName ?? "Sin nombre"),
    mail: u.mail ?? "",
    userPrincipalName: u.userPrincipalName ?? "",
    jobTitle: u.jobTitle ?? "",
  };
}