export type TeamDto = {
  id: number;
  name: string;
  description: string;
  avatar: string;
  updatedAt: string | null;
  createdAt: string | null;
  currentUserRole: "owner" | "member";
};

export type TeamMemberDto = {
  teamId: number;
  userId: number;
  role: "owner" | "member";
  joinedAt: string | null;
  username: string;
};

export type PaginatedList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
