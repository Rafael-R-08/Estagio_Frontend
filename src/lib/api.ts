export type ListResponse<T> = T[] | { data?: T[] } | null | undefined;

export function toList<T>(payload: ListResponse<T>): T[] {
	if (Array.isArray(payload)) return payload;
	if (payload && Array.isArray(payload.data)) return payload.data;
	return [];
}
