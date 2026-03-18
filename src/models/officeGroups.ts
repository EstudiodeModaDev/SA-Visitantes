export type OfficeGroupMember = {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
};

export type OfficeUserOption = {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
};

export type GraphUserLike = {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
  "@odata.type"?: string;
};