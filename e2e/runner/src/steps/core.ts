import { World as CucumberWorld } from "@cucumber/cucumber";
import { Page as CucumberPage } from "@playwright/test";
import FileProvider from "../logic/FileProvider/FileProvider";
import Page from "../logic/Page/Page";
import ContentAwaiter from "./catalog/article/content/logic/ContentAwaiter";

export class Core extends CucumberWorld {
	private _page: Page;
	private _fp: FileProvider;
	private _contentAwaiter: ContentAwaiter;

	constructor(options) {
		super(options);
	}

	initPage(page: CucumberPage) {
		this._page = new Page(page);
		this._fp = new FileProvider(page);
		this._contentAwaiter = new ContentAwaiter(page);
	}

	get page() {
		return this._page;
	}

	get fp() {
		return this._fp;
	}

	get contentAwaiter() {
		return this._contentAwaiter;
	}
}

/**

MainPage
    groupHeader
    catalog
    topMenu
        button

LeftTopbar
    title
    button

LeftSidebar
    pathTitle
    counter

RightSidebar
    button
    counter

Content
    title
    text
        link
        tulltip
            title
            text
            link

Modal
    modalLeftbar
        tab
            userName
            dateTime
            counter
    modalContent
        text
        commentWindow
            field
            userName
            comment
            button
                dropdown
    button
    field
    dropdown

 */
