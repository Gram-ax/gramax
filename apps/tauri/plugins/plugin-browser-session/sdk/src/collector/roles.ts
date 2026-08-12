import type { CollectorConfig } from "./config";
import type { DOMUtils } from "./dom";
import type { TextNormalizer } from "./text";
import type { AccessibleName } from "./types";

type RoleMapper = (element: Element) => string | null;

export class RoleResolver {
	private readonly _roleMappings: Record<string, RoleMapper> = {
		a: (element) => (element.hasAttribute("href") ? "link" : null),
		button: () => "button",
		summary: () => "button",
		textarea: () => "textbox",
		select: (element) => ((element as HTMLSelectElement).multiple ? "listbox" : "combobox"),
		option: () => "option",
		img: () => "img",
		nav: () => "navigation",
		main: () => "main",
		form: () => "form",
		ul: () => "list",
		ol: () => "list",
		li: () => "listitem",
		table: () => "table",
		tr: () => "row",
		td: () => "cell",
		th: () => "columnheader",
		header: (element) => ((element as HTMLElement).closest("article, aside, nav, section") ? null : "banner"),
		footer: (element) => ((element as HTMLElement).closest("article, aside, nav, section") ? null : "contentinfo"),
		aside: () => "complementary",
		search: () => "search",
		fieldset: () => "group",
		input: (element) => {
			const type = (element.getAttribute("type") || "text").toLowerCase();
			if (["button", "submit", "reset", "image"].includes(type)) {
				return "button";
			}
			if (type === "checkbox") {
				return "checkbox";
			}
			if (type === "radio") {
				return "radio";
			}
			if (type === "range") {
				return "slider";
			}
			if (type === "search") {
				return "searchbox";
			}
			if (type === "number") {
				return "spinbutton";
			}
			if (["hidden", "file"].includes(type)) {
				return null;
			}
			return "textbox";
		},
	};

	constructor(
		private readonly _config: CollectorConfig,
		private readonly _dom: DOMUtils,
		private readonly _text: TextNormalizer,
	) {}

	resolveRole(element: Element): string | null {
		const explicitRole = this._text.normalize(element.getAttribute("role")).toLowerCase();
		if (explicitRole && explicitRole !== "presentation" && explicitRole !== "none") {
			return explicitRole.split(/\s+/)[0];
		}

		const tag = element.tagName.toLowerCase();
		if (this._config.headingTags.has(tag)) {
			return "heading";
		}

		if (this._roleMappings[tag]) {
			return this._roleMappings[tag](element);
		}

		return null;
	}

	nativeInteractive(element: Element, role: string | null): boolean {
		const tag = element.tagName.toLowerCase();
		if (role && this._config.interactiveRoles.has(role)) {
			return true;
		}
		if (["button", "select", "textarea", "summary"].includes(tag)) {
			return true;
		}
		if (tag === "a" && element.hasAttribute("href")) {
			return true;
		}
		if (tag === "input" && (element.getAttribute("type") || "text") !== "hidden") {
			return true;
		}
		if ((element as HTMLElement).isContentEditable) {
			return true;
		}
		return false;
	}

	heuristicInteractive(element: Element, style: CSSStyleDeclaration): boolean {
		if (element.hasAttribute("onclick") || element.hasAttribute("tabindex")) {
			return true;
		}
		if (style.cursor === "pointer") {
			return true;
		}
		const classAndId =
			`${(element as HTMLElement).className || ""} ${(element as HTMLElement).id || ""}`.toLowerCase();
		return /(^|\s|-|_)(search|submit|close|menu|toggle|dropdown|select|btn|button)(\s|-|_|$)/.test(classAndId);
	}

	containsNativeInteractive(element: Element): boolean {
		return Boolean(
			element.querySelector?.("a[href], button, select, textarea, summary, input:not([type='hidden'])"),
		);
	}

	contentsName(element: Element): string {
		return this._text.joinPunctuation(
			this._text.normalize(this._dom.subtreeText(element), this._config.maxNameLength),
		);
	}

	accessibleName(element: Element): AccessibleName {
		const labelledBy = this._dom.referencedText(element, "aria-labelledby");
		if (labelledBy) {
			return { name: labelledBy, fromContents: false };
		}

		const ariaLabel = this._text.normalize(element.getAttribute("aria-label"), this._config.maxNameLength);
		if (ariaLabel) {
			return { name: ariaLabel, fromContents: false };
		}

		const explicitLabel = this._dom.labelText(element);
		if (explicitLabel) {
			return { name: explicitLabel, fromContents: false };
		}

		const tag = element.tagName.toLowerCase();
		if (["input", "select", "textarea"].includes(tag)) {
			const wrappingLabel = (element as HTMLElement).closest?.("label");
			if (wrappingLabel) {
				const text = this._text.joinPunctuation(
					this._text.normalize(this._dom.subtreeText(wrappingLabel), this._config.maxNameLength),
				);
				if (text) {
					return { name: text, fromContents: false };
				}
			}
		}

		if (tag === "img" || tag === "area") {
			const alt = this._text.normalize(element.getAttribute("alt"), this._config.maxNameLength);
			if (alt) {
				return { name: alt, fromContents: false };
			}
		}

		const title = this._text.normalize(element.getAttribute("title"), this._config.maxNameLength);
		if (title) {
			return { name: title, fromContents: false };
		}

		if (tag === "input") {
			const type = (element.getAttribute("type") || "text").toLowerCase();
			if (["submit", "button", "reset", "image"].includes(type)) {
				const value = this._text.normalize((element as HTMLInputElement).value, this._config.maxNameLength);
				if (value) {
					return { name: value, fromContents: false };
				}
			}
		}

		const contents = this.contentsName(element);
		if (contents) {
			return { name: contents, fromContents: true };
		}

		const placeholder = this._text.normalize(element.getAttribute("placeholder"), this._config.maxNameLength);
		if (placeholder) {
			return { name: placeholder, fromContents: false };
		}

		return { name: "", fromContents: false };
	}

	getStates(element: Element): string[] {
		const states: string[] = [];
		if ((element as HTMLButtonElement).disabled || element.getAttribute("aria-disabled") === "true") {
			states.push("disabled");
		}

		const tag = element.tagName.toLowerCase();
		const inputType = (element.getAttribute("type") || "").toLowerCase();
		if (tag === "input" && (inputType === "checkbox" || inputType === "radio")) {
			states.push((element as HTMLInputElement).checked ? "checked" : "unchecked");
		} else if (element.hasAttribute("aria-checked")) {
			states.push(element.getAttribute("aria-checked") === "true" ? "checked" : "unchecked");
		}

		for (const attr of ["aria-expanded", "aria-selected", "aria-current"]) {
			const value = element.getAttribute(attr);
			if (value && value !== "false") {
				states.push(value === "true" ? attr.slice(5) : `${attr.slice(5)}=${value}`);
			}
		}

		return states;
	}
}
