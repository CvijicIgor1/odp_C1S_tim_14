export function safeInt(value: number, fallback: number): number
{
    const n = Math.floor(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function parsePagination(
    query: Record<string, unknown>,
    defaultLimit = 20,
    maxLimit = 100
): { page: number; limit: number }
{
    const page  = Math.max(1, parseInt(String(query.page  ?? "1"),  10) || 1);
    const limit = Math.min(Math.max(1, parseInt(String(query.limit ?? String(defaultLimit)), 10) || defaultLimit), maxLimit);
    return { page, limit };
}
