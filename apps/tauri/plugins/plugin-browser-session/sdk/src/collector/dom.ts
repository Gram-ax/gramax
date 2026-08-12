import type { CollectorConfig } from "./config";
import type { TextNormalizer } from "./text";

export class DOMUtils {
	constructor(
		private readonly _windowLike: Window,
		private readonly _config: CollectorConfig,
		private readonly _text: TextNormalizer,
	) {}

	cssEscape(value: string): string {
		const g = this._windowLike as unknown as typeof globalThis;
		if (g.CSS && typeof g.CSS.escape === "function") {
			return g.CSS.escape(value);
		}

		return String(value).replace(/["\\]/g, "\\$&");
	}

	getFrameDocument(frameElement: HTMLIFrameElement | HTMLFrameElement): Document | null {
		try {
			return (
				(frameElement as HTMLIFrameElement).contentDocument ||
				(frameElement as HTMLIFrameElement).contentWindow?.document ||
				null
			);
		} catch (_) {
			return null;
		}
	}

	isInViewportBand(rect: DOMRect, view: Window): boolean {
		return (
			rect.bottom >= -this._config.viewportMargin &&
			rect.right >= 0 &&
			rect.top <= view.innerHeight + this._config.viewportMargin &&
			rect.left <= view.innerWidth
		);
	}

	isVisible(element: Element, view: Window): boolean {
		const rect = element.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) {
			return false;
		}

		const style = view.getComputedStyle(element);
		if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
			return false;
		}

		if ((element as HTMLElement).closest?.("[hidden], [aria-hidden='true']")) {
			return false;
		}

		return this.isInViewportBand(rect, view);
	}

	isInlineDisplay(style: CSSStyleDeclaration): boolean {
		const display = style.display || "";
		return display.startsWith("inline") || display === "contents";
	}

	findElementByAgentId(root: Document | ShadowRoot | null, elementId: string): Element | null {
		if (!root) {
			return null;
		}

		const selector = `[data-agent-id="${this.cssEscape(String(elementId))}"]`;
		const direct = root.querySelector?.(selector);
		if (direct) {
			return direct;
		}

		const descendants = root.querySelectorAll?.("*") || [];
		for (const element of descendants) {
			if (element.shadowRoot) {
				const shadowMatch = this.findElementByAgentId(element.shadowRoot, elementId);
				if (shadowMatch) {
					return shadowMatch;
				}
			}

			const tag = element.tagName?.toLowerCase();
			if (tag === "iframe" || tag === "frame") {
				const frameDocument = this.getFrameDocument(element as HTMLIFrameElement);
				const frameMatch = this.findElementByAgentId(frameDocument, elementId);
				if (frameMatch) {
					return frameMatch;
				}
			}
		}

		return null;
	}

	labelText(element: Element): string {
		if (!(element as HTMLElement).id) {
			return "";
		}

		const labels = element.ownerDocument?.querySelectorAll(
			`label[for="${this.cssEscape((element as HTMLElement).id)}"]`,
		);
		return this._text.normalize(
			Array.from(labels || [])
				.map((label) => label.textContent)
				.join(" "),
			this._config.maxNameLength,
		);
	}

	referencedText(element: Element, attrName: string): string {
		const attrValue = element.getAttribute(attrName);
		if (!attrValue) {
			return "";
		}

		return this._text.normalize(
			attrValue
				.split(/\s+/)
				.map((id) => element.ownerDocument?.getElementById(id)?.textContent || "")
				.join(" "),
			this._config.maxNameLength,
		);
	}

	subtreeText(node: Node): string {
		if (node.nodeType === Node.TEXT_NODE) {
			return node.textContent || "";
		}
		if (node.nodeType !== Node.ELEMENT_NODE) {
			return "";
		}

		const element = node as Element;
		const tag = element.tagName.toLowerCase();
		if (this._config.skippedTags.has(tag)) {
			return "";
		}
		if (tag === "br") {
			return " ";
		}
		if (tag === "img") {
			return element.getAttribute("alt") || "";
		}

		let text = "";
		for (const child of element.childNodes) {
			const childText = this.subtreeText(child);
			if (!childText) {
				continue;
			}
			if (text && !/\s$/.test(text) && !/^\s/.test(childText)) {
				text += " ";
			}
			text += childText;
		}
		return text;
	}
}
