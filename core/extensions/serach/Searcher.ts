export default interface Searcher {
	resetAllCatalogs: () => Promise<void>;
	searchAll: (query: string, ids: { [catalogName: string]: string[] }) => Promise<SearchItem[]>;
	search: (query: string, catalogName: string, id: string[]) => Promise<SearchItem[]>;
}

export interface SearchItem {
	name: { targets: { start: string; target: string }[]; end: string }; // Title
	paragraph: { prev: string; target: string; next: string }[]; // Texts with matches
	count: number; // Number of matches
	score: number; // Match coefficient (higher is better)
	url: string;
}
