import { ItemRef } from "../../logic/FileStructue/Item/Item";

export default interface Searcher {
	resetAllCatalogs: () => Promise<void>;
	searchAll: (query: string, itemRefs: { [catalogName: string]: ItemRef[] }) => Promise<SearchItem[]>;
	search: (query: string, catalogName: string, itemRefs: ItemRef[]) => Promise<SearchItem[]>;
}

export interface SearchItem {
	name: { targets: { start: string; target: string }[]; end: string }; // Заголовок
	paragraph: { prev: string; target: string; next: string }[]; // Тексты с совпадениями
	count: number; // Количество совпадений
	score: number; // Коэфициент совпадения (чем больше тем лучше)
	url: string;
}
