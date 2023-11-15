import { Page as CucumberPage } from "@playwright/test";
import Content from "./content/content";

class Article {
	constructor(private _page: CucumberPage) {}

	get content(): Content {
		return new Content(this._page);
	}
}

export default Article;
