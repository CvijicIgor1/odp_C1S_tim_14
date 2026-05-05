export type TeamDto = {
  id: number;
  name: string;
  description: string;
  avatar: string;
  updatedAt: string | null;
  createdAt: string | null;
};

export type TeamMemberDto = {
  teamId: number;
  userId: number;
  role: "owner" | "member";
  joinedAt: string | null;
};

export type PaginatedList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
