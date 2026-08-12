import type { InteractiveElementInfo } from "../types";
import type { CollectorConfig } from "./config";
import type { DOMUtils } from "./dom";
import type { RoleResolver } from "./roles";
import type { TextNormalizer } from "./text";
import type { ElementTreeNode, PageSnapshot, TextTreeNode, TreeNode, TreeState } from "./types";

export class AccessibilityTreeBuilder {
	constructor(
		private readonly _windowLike: Window,
		private readonly _documentLike: Document,
		private readonly _config: CollectorConfig,
		private readonly _text: TextNormalizer,
		private readonly _dom: DOMUtils,
		private readonly _roles: RoleResolver,
	) {}

	createTreeState(): TreeState {
		return {
			elementCounter: 0,
			interactiveElementsInfo: {},
			seenElements: new WeakSet(),
		};
	}

	assignInteractiveId(treeState: TreeState, element: Element, name: string): number {
		if (treeState.seenElements.has(element)) {
			return Number(element.getAttribute("data-agent-id"));
		}

		treeState.seenElements.add(element);
		treeState.elementCounter += 1;
		const id = treeState.elementCounter;
		element.setAttribute("data-agent-id", String(id));

		const tag = element.tagName.toLowerCase();
		const elementInfo: InteractiveElementInfo = {
			tag,
			text: name || tag,
			href:
				tag === "a" && (element as HTMLAnchorElement).href
					? this._text.cleanUrl((element as HTMLAnchorElement).href)
					: undefined,
			src: element.getAttribute("src") ?? undefined,
			placeholder: element.hasAttribute("placeholder")
				? this._text.normalize(element.getAttribute("placeholder"))
				: undefined,
		};
		if ((element as HTMLButtonElement).disabled || element.getAttribute("aria-disabled") === "true") {
			elementInfo.disabled = true;
		}

		treeState.interactiveElementsInfo[id] = elementInfo;
		return id;
	}

	buildNodes(node: Node, view: Window, treeState: TreeState): TreeNode[] {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = this._text.normalize(node.textContent, this._config.maxTextLength);
			return text ? [{ kind: "text", text, sealed: false }] : [];
		}
		if (node.nodeType !== Node.ELEMENT_NODE) {
			return [];
		}

		const element = node as Element;
		const tag = element.tagName.toLowerCase();

		const isFormInput = ["input", "textarea", "select"].includes(tag) && element.getAttribute("type") !== "hidden";

		if (this._config.skippedTags.has(tag) || (!isFormInput && !this._dom.isVisible(element, view))) {
			return [];
		}

		if (tag === "iframe" || tag === "frame") {
			return this._frameNodes(element as HTMLIFrameElement, view, treeState);
		}

		if (tag === "img") {
			const alt = this._text.normalize(
				element.getAttribute("alt") || element.getAttribute("title"),
				this._config.maxNameLength,
			);
			if (alt) {
				const id = this.assignInteractiveId(treeState, element, alt);
				return [{ kind: "element", role: "img", name: alt, children: [], inline: false, id, embedName: alt }];
			}
			return [];
		}

		const style = view.getComputedStyle(element);
		let role = this._roles.resolveRole(element);
		const native = this._roles.nativeInteractive(element, role);
		if (
			!native &&
			!role &&
			this._roles.heuristicInteractive(element, style) &&
			!this._roles.containsNativeInteractive(element)
		) {
			role = "button";
		}

		if (role && (native || this._config.interactiveRoles.has(role))) {
			return this._interactiveNodes(element, role, style, view, treeState);
		}

		if (role === "heading") {
			return this._headingNodes(element, tag, view, treeState);
		}

		if (tag === "label") {
			const children = this._sealRuns(this._collectChildren(element, view, treeState));
			const controls = children.filter((child) => child.kind === "element");
			return children.filter(
				(child) =>
					!(
						child.kind === "text" &&
						controls.some((control) => this._nodeSemanticText(control).includes(child.text))
					),
			);
		}

		const children = this._collectChildren(element, view, treeState);
		if (role && this._config.structuralRoles.has(role)) {
			return this._structuralNodes(element, role, this._sealRuns(children));
		}

		if (!this._dom.isInlineDisplay(style)) {
			const sealed = this._sealRuns(children);
			const label = this._text.normalize(
				element.getAttribute("aria-label") || element.getAttribute("title"),
				this._config.maxNameLength,
			);
			if (label && sealed.length > 0 && sealed.some((child) => child.kind === "element")) {
				return [
					{
						kind: "element",
						role: "group",
						name: label,
						children: sealed,
						inline: false,
					},
				];
			}
			return sealed;
		}
		return children;
	}

	render(nodes: TreeNode[]): string {
		const lines: string[] = [];
		for (const node of nodes) {
			this._renderNode(node, 0, lines);
		}
		return lines.join("\n").trim();
	}

	observePage(
		emptyTreeLabel: string,
	): PageSnapshot & { interactiveElementsInfo: TreeState["interactiveElementsInfo"] } {
		if (!this._documentLike?.body) {
			return {
				url: this._windowLike.location.href,
				title: this._documentLike?.title || "",
				accessibilityTree: emptyTreeLabel,
				isBottomReached: true,
				interactiveElementsInfo: {},
			};
		}

		const treeState = this.createTreeState();
		const nodes = this.buildNodes(this._documentLike.body, this._windowLike, treeState);
		const cleanTree = this.render(nodes) || emptyTreeLabel;
		const currentLowerBound = this._windowLike.scrollY + this._windowLike.innerHeight + this._config.viewportMargin;
		const totalPageHeight = this._documentLike.documentElement.scrollHeight;

		return {
			url: this._windowLike.location.href,
			title: this._documentLike.title || "",
			accessibilityTree: cleanTree.slice(0, this._config.maxTreeLength),
			isBottomReached: currentLowerBound >= totalPageHeight,
			interactiveElementsInfo: treeState.interactiveElementsInfo,
		};
	}

	private _nodeSemanticText(node: TreeNode): string {
		if (node.kind === "text") {
			return node.text;
		}

		return node.embedName || node.name || "";
	}

	private _isInteractiveNode(node: TreeNode): node is ElementTreeNode {
		return node.kind === "element" && typeof node.id === "number";
	}

	private _isRunItem(node: TreeNode): boolean {
		return (node.kind === "text" && !node.sealed) || (node.kind === "element" && node.inline);
	}

	private _flushRun(run: TreeNode[], out: TreeNode[]): void {
		if (!run.length) {
			return;
		}

		const hasText = run.some((item) => item.kind === "text" && this._text.hasLettersOrDigits(item.text));
		const hasInlineElement = run.some((item) => item.kind === "element");

		if (hasText && hasInlineElement) {
			const text = run.map((item) => this._nodeSemanticText(item)).join(" ");
			out.push({
				kind: "text",
				text: this._text.normalize(this._text.joinPunctuation(text), this._config.maxTextLength),
				sealed: true,
			});
			return;
		}

		if (!hasInlineElement) {
			const text = this._text.normalize(
				this._text.joinPunctuation(run.map((item) => this._nodeSemanticText(item)).join(" ")),
				this._config.maxTextLength,
			);
			if (text) {
				out.push({ kind: "text", text, sealed: true });
			}
			return;
		}

		for (const item of run) {
			if (item.kind === "element") {
				out.push({ ...item, inline: false });
			} else if (this._text.hasLettersOrDigits(item.text)) {
				out.push({ kind: "text", text: item.text, sealed: true });
			}
		}
	}

	private _mergeTextNeighbors(items: TreeNode[]): TreeNode[] {
		const out: TreeNode[] = [];
		for (const item of items) {
			const prev = out[out.length - 1];
			if (item.kind === "text" && prev?.kind === "text") {
				if (prev.text === item.text) {
					continue;
				}
				if (this._text.isPunctuationOnly(item.text) || this._text.isPunctuationOnly(prev.text)) {
					prev.text = this._text.normalize(
						this._text.joinPunctuation(`${prev.text} ${item.text}`),
						this._config.maxTextLength,
					);
					continue;
				}
			}
			out.push(item);
		}
		return out;
	}

	private _sealRuns(items: TreeNode[]): TreeNode[] {
		const out: TreeNode[] = [];
		let run: TreeNode[] = [];
		for (const item of items) {
			if (this._isRunItem(item)) {
				run.push(item);
				continue;
			}
			this._flushRun(run, out);
			run = [];
			out.push(item);
		}
		this._flushRun(run, out);
		return this._mergeTextNeighbors(out);
	}

	private _collectChildren(element: Element, view: Window, treeState: TreeState): TreeNode[] {
		const nodes: TreeNode[] = [];
		for (const child of Array.from(element.childNodes)) {
			nodes.push(...this.buildNodes(child, view, treeState));
		}
		if (element.shadowRoot) {
			for (const child of Array.from(element.shadowRoot.childNodes)) {
				nodes.push(...this.buildNodes(child, view, treeState));
			}
		}
		return nodes;
	}

	private _frameNodes(element: HTMLIFrameElement, view: Window, treeState: TreeState): TreeNode[] {
		const frameDocument = this._dom.getFrameDocument(element);
		if (frameDocument?.body) {
			const frameTitle = this._text.normalize(
				frameDocument.title || element.getAttribute("title"),
				this._config.maxNameLength,
			);
			const children = this.buildNodes(frameDocument.body, frameDocument.defaultView || view, treeState);
			if (!children.length) {
				return [];
			}
			return [
				{
					kind: "element",
					role: "frame",
					name: frameTitle || undefined,
					children,
					inline: false,
				},
			];
		}

		const frameName =
			this._text.normalize(element.getAttribute("title"), this._config.maxNameLength) ||
			this._text.normalize(element.getAttribute("src") ?? "", 80);
		return [
			{
				kind: "element",
				role: "frame",
				name: frameName ? `${frameName} (cross-origin)` : "cross-origin",
				children: [],
				inline: false,
			},
		];
	}

	private _headingNodes(element: Element, tag: string, view: Window, treeState: TreeState): TreeNode[] {
		const level = this._config.headingTags.has(tag) ? tag : `h${element.getAttribute("aria-level") || "2"}`;
		const children = this._sealRuns(this._collectChildren(element, view, treeState));
		const interactiveChildren = children.filter((node) => this._isInteractiveNode(node));

		if (interactiveChildren.length === 1 && children.length === 1) {
			const [child] = interactiveChildren;
			return [
				{
					...child,
					role: level,
					children: child.children,
					inline: false,
				},
			];
		}

		const name = this._roles.contentsName(element);
		if (!name) {
			return children;
		}

		return [
			{
				kind: "element",
				role: level,
				name,
				children: interactiveChildren.length > 0 ? interactiveChildren : [],
				inline: false,
			},
		];
	}

	private _interactiveNodes(
		element: Element,
		role: string,
		style: CSSStyleDeclaration,
		view: Window,
		treeState: TreeState,
	): TreeNode[] {
		const tag = element.tagName.toLowerCase();
		const { name, fromContents } = this._roles.accessibleName(element);
		const id = this.assignInteractiveId(treeState, element, name);
		const attributes = this._roles.getStates(element);

		const img = element.querySelector("img");
		const imgAlt = img
			? this._text.normalize(img.getAttribute("alt") || img.getAttribute("title"), this._config.maxNameLength)
			: "";
		const roleLabel = img && (fromContents || name?.includes(imgAlt)) ? `${role} (img)` : role;

		if (role === "textbox" || role === "searchbox" || role === "spinbutton" || tag === "input") {
			const value = this._text.normalize((element as HTMLInputElement).value, this._config.maxNameLength);
			const placeholder = this._text.normalize(element.getAttribute("placeholder"), this._config.maxNameLength);
			if (value) {
				attributes.push(`value=${this._text.quote(value)}`);
			}
			if (!value && placeholder) {
				attributes.push(`placeholder=${this._text.quote(placeholder)}`);
			}
			return [
				{
					kind: "element",
					role: roleLabel,
					name: name || placeholder || tag,
					attributes,
					children: [],
					inline: false,
					id,
					embedName: name || placeholder || tag,
				},
			];
		}

		if (tag === "select") {
			const selected = this._text.normalize(
				(element as HTMLSelectElement).selectedOptions?.[0]?.textContent,
				this._config.maxNameLength,
			);
			if (selected) {
				attributes.push(`value=${this._text.quote(selected)}`);
			}
			return [
				{
					kind: "element",
					role: roleLabel,
					name: name || tag,
					attributes,
					children: [],
					inline: false,
					id,
					embedName: name || selected || tag,
				},
			];
		}

		const children = this._sealRuns(this._collectChildren(element, view, treeState));

		const keptChildren = children.filter((child) => {
			const childText = this._nodeSemanticText(child);
			if (!childText) {
				return false;
			}

			if (name?.includes(childText)) {
				return false;
			}

			if (this._isInteractiveNode(child)) {
				if (child.name === name || name === tag) {
					return false;
				}
			}

			return true;
		});

		const node: ElementTreeNode = {
			kind: "element",
			role: roleLabel,
			name: name || tag,
			attributes,
			children: fromContents
				? keptChildren.filter((child) => !this._nodeSemanticText(child) || this._isInteractiveNode(child))
				: keptChildren,
			inline:
				this._dom.isInlineDisplay(style) &&
				keptChildren.length === 0 &&
				Boolean(name) &&
				name.length <= 80 &&
				!img,
			id,
			embedName: name || tag,
		};

		return [node];
	}

	private _structuralNodes(element: Element, role: string, children: TreeNode[]): TreeNode[] {
		const label = this._text.normalize(
			element.getAttribute("aria-label") || element.getAttribute("title"),
			this._config.maxNameLength,
		);

		if (role === "cell" && !label) {
			return children;
		}
		if (role === "listitem" && !label && children.length <= 1) {
			return children;
		}
		if (role === "row" && children.length && children.every((child) => child.kind === "text")) {
			const text = children.map((child) => (child as TextTreeNode).text).join(" | ");
			return [{ kind: "text", text: this._text.normalize(text, this._config.maxTextLength), sealed: true }];
		}
		if (!children.length) {
			return [];
		}

		return [
			{
				kind: "element",
				role,
				name: label || undefined,
				children,
				inline: false,
			},
		];
	}

	private _renderNode(node: TreeNode, depth: number, out: string[]): void {
		const indent = "  ".repeat(depth);
		if (node.kind === "text") {
			out.push(`${indent}text ${this._text.quote(node.text)}`);
			return;
		}

		const line = [
			typeof node.id === "number" ? `[${node.id}]` : null,
			node.role,
			node.name ? this._text.quote(node.name) : null,
		]
			.filter(Boolean)
			.join(" ");
		const attributes = node.attributes?.length ? ` [${node.attributes.join(", ")}]` : "";
		out.push(`${indent}${line}${attributes}`);
		for (const child of node.children) {
			this._renderNode(child, depth + 1, out);
		}
	}
}
