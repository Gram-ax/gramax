import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import isVideoSupported from "@ext/markdown/elements/video/logic/isVideoSupported";
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

		const newHTML = this._lineBreakers(html);
		const doc = new DOMParser().parseFromString(newHTML, "text/html");
		this._removeTrash(doc);
		this._lists(doc);
		this._links(doc);

		if (this._isTauri) {
			void (async () => {
				await this._images(doc.body, (oldImage, newImage) => {
					const parentNode = this._getImageParentNode(oldImage);
					if (!parentNode) return;
					parentNode.replaceWith(newImage);
				});
				this._insertContent(doc);
			})();

			return;
		}

		return doc.body.innerHTML !== "undefined" && doc.body.innerHTML;
	};

	public getResourcePath = (src: string) => {
		return /file:\/\/\/(.*[/\\])/.exec(src)?.[1] || /file:\/\/\/(.*\/)/.exec(src)?.[1];
	};

	private _lineBreakers = (html: string) => {
		html = html.replace(/<br\s*\/?>/gi, "</p><p>");
		html = html.replace(/<p><\/p>/gi, "");
		html = html.replace(/<p>(.*?)<\/p>/gi, (match, content) => {
			const boldMatch = content.match(/<b>(.*?)<\/b>/i);
			if (boldMatch) {
				return `<p><b>${boldMatch[1]}</b></p>`;
			}
			return `<p>${content}</p>`;
		});
		html = html.replace(/<p><\/p>/gi, "");
		html = html.replaceAll(/\u00A0/g, " ");

		return html;
	};

	private _changeAttrs = (html: string) => {
		html.replaceAll("colspan", "colSpan");
		html.replaceAll("rowspan", "rowSpan");
	};

	private _removeTrash = (doc: Document) => {
		doc.querySelectorAll("tr[height='0']").forEach((tr) => tr.remove());
	};

	private _lists = (doc: Document) => {
		const listStack = [];
		let previousLfo = null;

		const msoListParagraphs = doc.querySelectorAll("p[style*='mso-list']");

		msoListParagraphs.forEach((p, index) => {
			const styleString = p.getAttribute("style");
			const matches = styleString.match(/mso-list:\s*[^;]*level(\d+)\s*lfo(\d+)/i);
			let level = parseInt(matches?.[1], 10);
			const lfo = matches?.[2];

			if (lfo !== previousLfo) {
				listStack.splice(0, listStack.length);
				previousLfo = lfo;

				if (level > 1) {
					level = 1;
				}
			}

			while (level !== listStack.length) {
				if (level > listStack.length) {
					const listMarkerText = p.querySelector("span > span")?.textContent.trim();
					const listType = /^(\d+\.)|([a-zA-Z]\.)/.test(listMarkerText) ? "ol" : "ul";

					const newList = document.createElement(listType);

					if (listStack.length > 0) listStack[listStack.length - 1].appendChild(newList);

					listStack.push(newList);
				} else {
					if (listStack.length === 0) return;
					listStack.pop();
				}
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

			const nextSibling = p.nextElementSibling;
			const nextInList = msoListParagraphs[index + 1];

			p.parentNode.replaceChild(listStack[0], p);

			if (!nextSibling || nextSibling !== nextInList) {
				listStack.splice(0, listStack.length);
			}
		});

		return doc;
	};

	private _images = async (
		element: HTMLElement,
		callback: (oldImage: HTMLImageElement, newImage: HTMLImageElement) => void,
	) => {
		const imgs: NodeListOf<HTMLImageElement> = element.querySelectorAll("img, v\\:imagedata");
		if (!imgs.length) return;

		const firstImage = imgs[0];
		const src =
			firstImage.parentElement.childNodes?.[0].textContent.match(/file:\/\/\/([^"]+)/)?.[0] ||
			firstImage.getAttribute("src");
		const isBlob = src.startsWith("blob:");
		const resourcePath = this.getResourcePath(src);
		if (!isBlob && !resourcePath) return;

		for (let index = 0; index < imgs.length; index++) {
			callback(imgs[index], await this._handleImage(imgs[index], resourcePath));
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
			const isNotOurDomain = link.host.length && window.location.host !== link.host;
			const isVideo = isVideoSupported(href);
			const isExternal = linkCreator.isExternalLink(href);

			if (isNotOurDomain && isVideo && link.childElementCount) return this._video(link);
			if (!href || href.length < 1) return;
			if (isExternal) return link.setAttribute("href", href);

			const startSlice = href.includes(link.baseURI) ? link.baseURI.length + 2 : 2;
			const newHref = "#" + href.slice(startSlice, startSlice + href.length).toLowerCase();
			link.setAttribute("hash", newHref);
			link.setAttribute("href", "");
			link.setAttribute("resourcepath", "./" + this._articleProps.fileName + ".md");
			link.setAttribute("newHref", this._articleProps.pathname + newHref);
		});

		return doc;
	};

	private _handleImage = async (image: HTMLImageElement, resourcePath?: string) => {
		const src = image.getAttribute("src");
		const isBlob = src.startsWith("blob:");
		const res = await FetchService.fetch(
			this._apiUrlCreator.createResourceFromPath(
				isBlob ? src : resourcePath,
				this._getImageFileName(isBlob, image),
			),
		);

		if (!res.ok) return;

		const newElement = document.createElement("image-react-component");
		newElement.setAttribute("src", (await res.json())?.newName);

		return newElement as HTMLImageElement;
	};

	private _getImageFileName = (isBlob: boolean, image: HTMLImageElement) => {
		const fileNameRegex = /([^\\/]+)\.(jpg|png|jpeg|gif)/;

		if (isBlob) {
			return image.getAttribute("src");
		}

		const match = fileNameRegex.exec(image.getAttribute("src"));

		if (match?.[0]) return match[0];

		if (image.parentElement.childNodes?.[0]) {
			const match = fileNameRegex.exec(image.parentElement.childNodes?.[0].textContent);
			return match?.[0];
		}
	};

	private _insertContent(doc: Document) {
		this._view.pasteHTML(doc.body.innerHTML);
	}

	private _getImageParentNode(image: HTMLImageElement) {
		const parentNode = image.closest("p");
		if (!parentNode) return;
		return parentNode;
	}
}

export default TransformerMsO;
