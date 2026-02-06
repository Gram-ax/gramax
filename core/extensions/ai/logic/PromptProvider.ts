import { PROMPT_DIRECTORY } from "@app/config/const";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";
import ArticleProvider from "@ext/articleProvider/logic/ArticleProvider";

declare module "@ext/articleProvider/logic/ArticleProvider" {
	export enum ArticleProviders {
		prompt = "prompt",
	}
}

export default class PromptProvider extends ArticleProvider {
	constructor(fp: FileProvider, fs: FileStructure, catalog: Catalog) {
		super(fp, fs, catalog, new Path(PROMPT_DIRECTORY));

		fs.events.on("catalog-read", async () => {
			await this.readArticles();
		});
	}
}
