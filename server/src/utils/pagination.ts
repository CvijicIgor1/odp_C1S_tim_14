export function safeInt(value: number, fallback: number): number
{
    const n = Math.floor(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}
