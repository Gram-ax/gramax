import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import { EditorView } from "prosemirror-view";

class TransformerMsO {
	private _articleProps: ClientArticleProps;
	private _apiUrlCreator: ApiUrlCreator;
	private _isTauri: boolean;
	private _view: EditorView;

	constructor(
		articleProps: ClientArticleProps,
		apiUrlCreator: ApiUrlCreator,
		isTauri: boolean = false,
		view: EditorView,
	) {
		this._articleProps = articleProps;
		this._apiUrlCreator = apiUrlCreator;
		this._isTauri = isTauri;
		this._view = view;
	}

	public parseFromHTML = (html: string): string => {
		const regexp = /(urn:schemas-microsoft-com.*)/gi.exec(html);
		if (!regexp || regexp?.[0] === null) return html;
		this._changeAttrs(html);

		const doc = new DOMParser().parseFromString(/<body[\s\S]*?>([\s\S]*)<\/body>/.exec(html)?.[0], "text/html");
		this._lists(doc);
		this._links(doc);

		if (this._isTauri) {
			void (async () => {
				await this._images(doc);
				this._insertContent(doc);
			})();

			return;
		}

		return doc.body.innerHTML !== "undefined" && doc.body.innerHTML;
	};

	private _changeAttrs = (html: string) => {
		html.replaceAll("colspan", "colSpan");
		html.replaceAll("rowspan", "rowSpan");
	};

	private _lists = (doc: Document) => {
		const listStack = [];
		let previousLfo = null;

		const msoListParagraphs = doc.querySelectorAll("p[style*='mso-list']");

		msoListParagraphs.forEach((p) => {
			const styleString = p.getAttribute("style");
			const matches = styleString.match(/mso-list:\s*[^;]*level(\d+)\s*lfo(\d+)/i);
			const level = parseInt(matches?.[1], 10);
			const lfo = matches?.[2];

			if (lfo !== previousLfo) {
				listStack.splice(0, listStack.length);
				previousLfo = lfo;
			}

			while (level !== listStack.length) {
				if (level > listStack.length) {
					const listMarkerText = p.querySelector("span > span")?.textContent.trim();
					const listType = /[·o§]+/.test(listMarkerText) ? "ul" : "ol";

					const newList = document.createElement(listType);

					if (listStack.length > 0) listStack[listStack.length - 1].appendChild(newList);

					listStack.push(newList);
				} else listStack.pop();
			}

			const markerSpan = p.querySelector("span > span");
			if (markerSpan) markerSpan.textContent = "";

			const li = document.createElement("li");
			let innerHTML = "";

			p.childNodes.forEach((node) => {
				if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE)
					innerHTML += (node as HTMLElement)?.outerHTML || node.textContent;
			});

			li.innerHTML = innerHTML.trim();
			listStack[listStack.length - 1].appendChild(li);
			p.parentNode.replaceChild(listStack[0], p);
		});

		return doc;
	};

	private _images = async (doc: Document) => {
		const imgs = doc.querySelectorAll("img");
		if (!imgs.length) return;
		const resourcePath = /file:\/\/\/(.*\/)/.exec(imgs[0].src)?.[1];
		if (!resourcePath) return;

		for (let index = 0; index < imgs.length; index++) {
			const element = imgs[index];
			const res = await FetchService.fetch(
				this._apiUrlCreator.createResourceFromPath(
					resourcePath,
					`${/([^\\/]+)\.(jpg|png|jpeg|gif)/.exec(element.src)?.[0]}`,
				),
			);

			if (!res.ok) continue;

			const newElement = document.createElement("image-react-component");
			newElement.setAttribute("src", (await res.json())?.newName);

			const parentNode =
				(element.parentNode as HTMLElement).tagName === "SPAN"
					? element.parentNode.parentElement
					: element.parentNode;
			(parentNode as HTMLElement).replaceWith(newElement);
		}
	};

	private _video = (element: HTMLAnchorElement) => {
		if (!element.href) return;
		const newElement = document.createElement("video-react-component");
		newElement.setAttribute("path", element.href);
		newElement.setAttribute("title", "");
		const parentNode =
			(element.parentNode as HTMLElement).tagName === "SPAN"
				? element.parentNode.parentElement
				: element.parentNode;
		(parentNode as HTMLElement).replaceWith(newElement);
	};

	private _links = (doc: Document) => {
		const msoLinks = doc.querySelectorAll("a");

		msoLinks.forEach((link) => {
			const href = link.getAttribute("href");

			if (link.host.length && window.location.host !== link.host && link.childElementCount)
				return this._video(link);
			if (!href || href.length < 1) return;

			if (link.host.length && window.location.host !== link.host && linkCreator.isExternalLink(href))
				return link.setAttribute("href", href);

			const startSlice = href.includes(link.baseURI) ? link.baseURI.length + 2 : 2;
			const newHref = "#" + href.slice(startSlice, startSlice + href.length).toLowerCase();
			link.setAttribute("hash", newHref);
			link.setAttribute("href", "");
			link.setAttribute("resourcepath", "./" + this._articleProps.fileName + ".md");
			link.setAttribute("newHref", this._articleProps.pathname + newHref);
		});

		return doc;
	};

	private _insertContent(doc: Document) {
		this._view.pasteHTML(doc.body.innerHTML);
	}
}

export default TransformerMsO;
