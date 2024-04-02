import SaveServiceData from "../models/Data";

export default interface Connection {
	setData: (data: SaveServiceData[]) => Promise<void>;
	resetData: (algoliaDatas: SaveServiceData[]) => Promise<void>;
	deleteData: (objectIDs: string[]) => Promise<void>;
	getSearchData: (query: string, filters: string[], tag: string) => Promise<ResponseData<SaveServiceData>>;
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
