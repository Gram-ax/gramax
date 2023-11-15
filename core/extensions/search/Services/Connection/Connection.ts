import SaveServiseData from "../models/Data";

export default interface Connection {
	setData: (data: SaveServiseData[]) => Promise<void>;
	resetData: (algoliaDatas: SaveServiseData[]) => Promise<void>;
	deleteData: (objectIDs: string[]) => Promise<void>;
	getSearchData: (query: string, filters: string[], tag: string) => Promise<ResponseData<SaveServiseData>>;
}

export interface ResponseData<TObject> {
	hits: Array<Hit<TObject>>;
}

type Hit<THit> = THit & {
	_snippetResult?: SnippetResult<THit>;
	logicPath: string;
};

type SnippetResult<THit> = THit extends string | number
	? SnippetMatch
	: { [KAttribute in keyof THit]: SnippetResult<THit[KAttribute]> };

type SnippetMatch = {
	value: string;
};
