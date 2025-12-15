export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
	column: string | null;
	direction: SortDirection;
}

export function sortData<T>(
	data: T[],
	sortConfig: SortConfig,
	accessors: Record<
		string,
		(item: T) => string | number | Date | boolean | null | undefined
	>
): T[] {
	if (!sortConfig.column || !sortConfig.direction) return data;

	const accessor = accessors[sortConfig.column];
	if (!accessor) return data;

	return [...data].sort((a, b) => {
		const aVal = accessor(a);
		const bVal = accessor(b);

		if (aVal == null && bVal == null) return 0;
		if (aVal == null) return 1;
		if (bVal == null) return -1;

		let cmp = 0;
		if (typeof aVal === "string" && typeof bVal === "string") {
			cmp = aVal.localeCompare(bVal);
		} else {
			cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
		}

		return sortConfig.direction === "asc" ? cmp : -cmp;
	});
}

export function toggleSort(
	currentConfig: SortConfig,
	column: string
): SortConfig {
	if (currentConfig.column !== column) {
		return { column, direction: "asc" };
	}
	if (currentConfig.direction === "asc") {
		return { column, direction: "desc" };
	}
	return { column: null, direction: null };
}
