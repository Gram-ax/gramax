import { Page as CucumberPage } from "@playwright/test";
import Article from "./article/article";

export default class Catalog {
	constructor(private _cucumberPage: CucumberPage) {}

	get article(): Article {
		return new Article(this._cucumberPage);
	}
}
