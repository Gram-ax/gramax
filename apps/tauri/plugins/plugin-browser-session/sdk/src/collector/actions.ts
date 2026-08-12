import type { AgentBrowserRequest } from "../types";
import type { DOMUtils } from "./dom";

export class ActionExecutor {
	constructor(
		private readonly _windowLike: Window,
		private readonly _documentLike: Document,
		private readonly _dom: DOMUtils,
	) {}

	requireElement(elementId: string): Element {
		const element = this._dom.findElementByAgentId(this._documentLike, elementId);
		if (!element) {
			throw new Error(`Element not found: ${elementId}`);
		}

		return element;
	}

	clickElement(elementId: string): true {
		const element = this.requireElement(elementId) as HTMLElement;
		element.scrollIntoView?.({ block: "center", inline: "center" });
		element.focus?.();
		element.click?.();
		return true;
	}

	typeIntoElement(elementId: string, value: string): true {
		const element = this.requireElement(elementId) as HTMLElement;
		element.scrollIntoView?.({ block: "center", inline: "center" });
		element.focus?.();

		const tag = element.tagName?.toLowerCase();
		if (element.isContentEditable) {
			element.textContent = value;
		} else if (tag === "select") {
			const selectEl = element as HTMLSelectElement;
			const option = Array.from(selectEl.options).find(
				(item) => item.value === value || item.textContent?.trim() === value,
			);
			if (option) {
				selectEl.value = option.value;
			}
		} else {
			const view = element.ownerDocument?.defaultView || this._windowLike;
			const g = view as unknown as typeof globalThis;
			const prototype = tag === "textarea" ? g.HTMLTextAreaElement.prototype : g.HTMLInputElement.prototype;
			const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
			if (setter) {
				setter.call(element, value);
			} else {
				(element as HTMLInputElement).value = value;
			}
		}

		element.dispatchEvent(new InputEvent("input", { bubbles: true, data: value }));
		element.dispatchEvent(new Event("change", { bubbles: true }));
		return true;
	}

	scrollDown(): true {
		this._windowLike.scrollBy({ top: 600, behavior: "smooth" });
		return true;
	}

	createActionHandlers(
		readPage: () => unknown,
		readElement: (elementId: string) => unknown,
	): Record<string, (payload: Record<string, unknown>) => unknown> {
		return {
			read_page: () => readPage(),
			read_element: (payload) => readElement(String(payload.elementId)),
			click: (payload) => this.clickElement(String(payload.elementId)),
			type: (payload) => this.typeIntoElement(String(payload.elementId), String(payload.text)),
			scroll: () => this.scrollDown(),
		};
	}

	async handleRequest(
		request: AgentBrowserRequest,
		handlers: Record<string, (payload: Record<string, unknown>) => unknown>,
	): Promise<unknown> {
		const action = request?.action;
		const payload = request?.payload || {};
		const handler = handlers[action];
		if (!handler) {
			throw new Error(`Unknown agent browser action: ${String(action)}`);
		}

		return await Promise.resolve(handler(payload));
	}
}
