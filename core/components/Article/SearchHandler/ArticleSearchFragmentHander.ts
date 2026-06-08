import { tabsSearchHighlighter } from "@ext/markdown/elements/tabs/render/logic/tabsSearchHighlighter";
import { textSelector } from "@ext/serach/utils/svgTextExtract";
import { noteFoundElementBeforeHighlightHandler } from "../../../extensions/markdown/elements/note/render/component/Note";

type BeforeHighlightHandler = (el: HTMLElement) => { additionalElementsToHighlight?: HTMLElement[] } | undefined;

const beforeHighlightHandlers: BeforeHighlightHandler[] = [
	tabsSearchHighlighter as BeforeHighlightHandler,
	noteFoundElementBeforeHighlightHandler as BeforeHighlightHandler,
];

function getHighlightFragmentFromUrl() {
	const currentUrl = new URL(document.URL);
	const highlightFragment = currentUrl.searchParams.get("highlightFragment") ?? "";
	const highlightFragmentIndex = parseInt(currentUrl.searchParams.get("highlightFragmentIndex") ?? "", 10);
	return { highlightFragment, highlightFragmentIndex };
}

export function highlightFragmentInEditorByUrl() {
	const { highlightFragment, highlightFragmentIndex } = getHighlightFragmentFromUrl();
	void highlightFragmentInEditor(highlightFragment, highlightFragmentIndex);
}

export async function highlightFragmentInEditor(highlightFragment: string, highlightFragmentIndex: number) {
	await waitRenderedElements();
	const promiseMirrorElSelector = ".tiptap.ProseMirror";
	const articleContentWrapper = document.querySelector<HTMLElement>(`.article-body ${promiseMirrorElSelector}`);

	const getOrCreateStyleEl = () => {
		const id = "article-highlight-fragment-style";
		const styleEl = document.querySelector(`style#${id}`);
		if (styleEl) return styleEl;
		const newStyleEl = document.createElement("style");
		newStyleEl.id = id;
		document.head.appendChild(newStyleEl);
		return newStyleEl;
	};

	highlightSearchFragment(
		highlightFragment,
		highlightFragmentIndex,
		articleContentWrapper,
		(els) => {
			const styleEl = getOrCreateStyleEl();
			let styleContent = "";
			let animationsPlaying = 0;

			for (const el of els) {
				//TODO: small duplication with global.css.
				styleContent += `
					${promiseMirrorElSelector} > ${getCssSelectorShort(el, articleContentWrapper)} {
						animation: BLINK_ANIMATION 1.5s forwards linear;
					}
				`;
				animationsPlaying++;
				el.addEventListener("animationend", () => {
					if (--animationsPlaying === 0) styleEl.innerHTML = "";
				});
			}

			styleEl.innerHTML = styleContent;
		},
		(foundEl) => {
			if (foundEl.tagName === "PRE")
				//Avoid important background for .child-wrapper in editor
				return { overrode: true, overrideEl: foundEl.querySelector(".child-wrapper > div") };
			return { overrode: false };
		},
		(contentEl) => {
			// Solution for highlighting the note title.
			// Note title is input element. Search in findElementToHighlight does not cover these cases (because it searches by `textContent`).
			// This solution is not perfect because it does not consider cases when the note is child of another block. For example, in a list or table.
			if (contentEl.classList.contains("react-renderer") && contentEl.classList.contains("node-note")) {
				const inputHeader = contentEl.querySelector<HTMLInputElement>(".admonition .title-editor input");
				const inputHeaderValue = inputHeader?.value ?? "";
				const substringCount = findSubstringCountForSearchFragment(inputHeaderValue, highlightFragment);
				return { substringCount, elWithContentFound: inputHeader };
			}
			if (
				contentEl.classList.contains("react-renderer") &&
				(contentEl.classList.contains("node-diagrams") || contentEl.classList.contains("node-drawio"))
			) {
				const diagramTitle = contentEl.querySelector<HTMLInputElement>("input.resource-caption");
				const titleText = diagramTitle?.value ?? "";
				const substringCount = findSubstringCountForSearchFragment(titleText, highlightFragment);
				return { substringCount, elWithContentFound: diagramTitle };
			}
		},
	);
}

export function highlightAllFragmentsInDocportalByUrl() {
	void highlightFragmentInDocportalByUrl();
	void highlightTextFragmentInDocportalByUrl();
}

export async function highlightFragmentInDocportalByUrl() {
	if (typeof document === "undefined") return;
	await waitRenderedElements();

	const { highlightFragment, highlightFragmentIndex } = getHighlightFragmentFromUrl();
	highlightFragmentInDocportal(highlightFragment, highlightFragmentIndex);
}

export function highlightFragmentInDocportal(highlightFragment: string, highlightFragmentIndex: number) {
	highlightSearchFragment(
		highlightFragment,
		highlightFragmentIndex,
		document.querySelector(".article-body article"),
		(els) => {
			const foundArticleClassName = "is-found-article-element";
			for (const el of els) {
				el.classList.add(foundArticleClassName);
				el.addEventListener("animationend", () => {
					el.classList.remove(foundArticleClassName);
				});
			}
		},
		(foundEl) => {
			if (foundEl.tagName === "PRE")
				return { overrode: true, overrideEl: foundEl.querySelector(".child-wrapper") };
			return { overrode: false };
		},
	);
}

// highlightedUrl — skips re-running on re-renders of the same page.
// activeRunId   — cancels a stale run if the URL changes while images are loading.
const TEXT_FRAGMENT_HIGHLIGHT = "gramax-text-fragment";
let activeRunId = 0;
let highlightedUrl: string | null = null;

export async function highlightTextFragmentInDocportalByUrl() {
	if (typeof document === "undefined") return;

	const parsed = parseNavTextFragment();

	if (!parsed) {
		removeCssHighlight();
		highlightedUrl = null;
		return;
	}

	if (highlightedUrl === parsed.url) return;

	const runId = ++activeRunId;
	highlightedUrl = parsed.url;
	removeCssHighlight();

	await waitRenderedElements();

	const article = document.querySelector<HTMLElement>(".article-body article");
	if (!article) {
		highlightedUrl = null; // allow retry on next render
		return;
	}
	if (runId !== activeRunId) return;

	await waitForArticleToSettle(article);
	if (runId !== activeRunId) return;

	const range = findTextRange(article, parsed.textStart, parsed.textEnd);
	if (!range) return;

	applyCssHighlight(range);
	scrollToRange(range);
}

// CSS Custom Highlight API is not yet in TypeScript's lib.dom, so we cast to access it.
const getCssHighlightRegistry = () =>
	(CSS as unknown as { highlights?: { set(k: string, v: object): void; delete(k: string): void } }).highlights;

const getCssHighlightConstructor = () => (window as unknown as { Highlight?: new (...r: Range[]) => object }).Highlight;

function applyCssHighlight(range: Range) {
	const Highlight = getCssHighlightConstructor();
	const registry = getCssHighlightRegistry();
	if (Highlight && registry) registry.set(TEXT_FRAGMENT_HIGHLIGHT, new Highlight(range));
}

function removeCssHighlight() {
	getCssHighlightRegistry()?.delete(TEXT_FRAGMENT_HIGHLIGHT);
}

// window.location.hash strips :~: entirely — full URL only available in performance.navigation[0].name.
function parseNavTextFragment(): { url: string; textStart: string; textEnd?: string } | null {
	const navUrl = (performance.getEntriesByType("navigation") as PerformanceNavigationTiming[])[0]?.name ?? "";

	const directiveStart = navUrl.indexOf(":~:");
	if (directiveStart === -1) return null;

	try {
		const nav = new URL(navUrl, document.baseURI);
		const cur = new URL(document.URL);
		if (nav.origin !== cur.origin || nav.pathname !== cur.pathname || nav.search !== cur.search) return null;
	} catch {
		return null;
	}

	const textParam = navUrl
		.slice(directiveStart + 3)
		.split("#")[0]
		.split("&")
		.find((p) => p.startsWith("text="))
		?.slice(5);
	if (!textParam) return null;

	// Strip optional disambiguation prefix ("prefix-,textStart") and suffix ("textStart,-suffix").
	let textPart = textParam;
	if (textPart.includes("-,")) textPart = textPart.slice(textPart.indexOf("-,") + 2);
	if (textPart.includes(",-")) textPart = textPart.slice(0, textPart.lastIndexOf(",-"));

	const [rawStart, rawEnd] = textPart.split(",");
	const textStart = decodeURIComponent(rawStart);
	const textEnd = rawEnd ? decodeURIComponent(rawEnd) : undefined;

	return textStart ? { url: navUrl, textStart, textEnd } : null;
}

function findTextRange(root: HTMLElement, textStart: string, textEnd?: string): Range | null {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) =>
			["SCRIPT", "STYLE", "NOSCRIPT"].includes((node as Text).parentElement?.tagName ?? "")
				? NodeFilter.FILTER_REJECT
				: NodeFilter.FILTER_ACCEPT,
	});

	// Flatten all text nodes into a single string, tracking each node's start offset.
	const textNodes: Text[] = [];
	const nodeStartOffsets: number[] = [];
	let fullText = "";

	let node = walker.nextNode() as Text | null;
	while (node) {
		nodeStartOffsets.push(fullText.length);
		fullText += node.data;
		textNodes.push(node);
		node = walker.nextNode() as Text | null;
	}

	const lowerText = fullText.toLowerCase();
	const startOffset = lowerText.indexOf(textStart.toLowerCase());
	if (startOffset === -1) return null;

	let endOffset = startOffset + textStart.length;
	if (textEnd) {
		const endIdx = lowerText.indexOf(textEnd.toLowerCase(), endOffset);
		if (endIdx !== -1) endOffset = endIdx + textEnd.length;
	}

	const charPosToNodeOffset = (charPos: number) => {
		let nodeIndex = nodeStartOffsets.length - 1;
		while (nodeIndex > 0 && nodeStartOffsets[nodeIndex] > charPos) nodeIndex--;
		return { node: textNodes[nodeIndex], offset: charPos - nodeStartOffsets[nodeIndex] };
	};

	const start = charPosToNodeOffset(startOffset);
	const end = charPosToNodeOffset(endOffset);
	const range = document.createRange();
	range.setStart(start.node, start.offset);
	range.setEnd(end.node, end.offset);
	return range;
}

async function waitForArticleToSettle(article: HTMLElement) {
	const pendingImgs = [...article.querySelectorAll<HTMLImageElement>("img")].filter((img) => !img.complete);
	if (pendingImgs.length) {
		await Promise.race([
			Promise.all(
				pendingImgs.map(
					(img) =>
						new Promise<void>((resolve) => {
							img.addEventListener("load", () => resolve(), { once: true });
							img.addEventListener("error", () => resolve(), { once: true });
						}),
				),
			),
			new Promise((resolve) => setTimeout(resolve, 2000)),
		]);
	}

	// Wait for layout shifts to stop after images load (debounced ResizeObserver).
	await new Promise<void>((resolve) => {
		let debounce: ReturnType<typeof setTimeout>;
		const finish = () => {
			clearTimeout(debounce);
			observer.disconnect();
			resolve();
		};
		const observer = new ResizeObserver(() => {
			clearTimeout(debounce);
			debounce = setTimeout(finish, 100);
		});
		observer.observe(article);
		debounce = setTimeout(finish, 100);
		setTimeout(finish, 1000);
	});
}

function scrollToRange(range: Range) {
	const scrollContainer = document.querySelector<HTMLElement>('[data-testid="article-scroll-container"]');
	if (!scrollContainer) {
		range.startContainer.parentElement?.scrollIntoView({ block: "center" });
		return;
	}
	const rangeRect = range.getBoundingClientRect();
	const containerRect = scrollContainer.getBoundingClientRect();
	scrollContainer.scrollTop +=
		rangeRect.top - containerRect.top - scrollContainer.clientHeight / 2 + rangeRect.height / 2;
}

function highlightSearchFragment(
	highlightFragment: string,
	highlightFragmentIndex: number,
	articleContentWrapper: Element,
	setAnimation: (el: HTMLElement[]) => void,
	overrideHighlightElement: OverrideHighlightElement,
	elementPreHandle?: ElementPreHandle,
) {
	if (highlightFragment && !Number.isNaN(highlightFragmentIndex)) {
		const foundEl = findElementToHighlight(
			highlightFragment,
			highlightFragmentIndex,
			articleContentWrapper,
			overrideHighlightElement,
			elementPreHandle,
		);

		if (foundEl) {
			const additionalElementsToHighlight: HTMLElement[] = [];
			beforeHighlightHandlers.forEach((handler) => {
				const handleResult = handler(foundEl);
				// biome-ignore lint/complexity/useOptionalChain: void return type cannot be optional-chained in TypeScript
				if (handleResult && handleResult.additionalElementsToHighlight)
					additionalElementsToHighlight.push(...handleResult.additionalElementsToHighlight);
			});

			highlightElements([foundEl, ...additionalElementsToHighlight], setAnimation);

			foundEl.scrollIntoView({ block: "center", behavior: "auto" });
		}
	}
}

type OverrideHighlightElement = (
	foundEl: HTMLElement,
) => { overrode: true; overrideEl: HTMLElement } | { overrode: false };

type ElementPreHandle = (
	contentEl: HTMLElement,
) => { substringCount: number; elWithContentFound?: HTMLElement } | undefined;

function findElementToHighlight(
	highlightFragment: string,
	highlightFragmentIndex: number,
	articleContentWrapper: Element,
	overrideHighlightElement: OverrideHighlightElement,
	elementPreHandle?: ElementPreHandle,
) {
	const findElementWithFragmentRecursively = (
		contentEls: HTMLCollectionOf<HTMLElement>,
		startCount: number,
	): HTMLElement | undefined => {
		const tagNamesToDontSearchInside = ["p", "h1", "h2", "h3", "h4", "h5", "h6"];
		let count = startCount;

		for (const contentEl of contentEls) {
			const tagName = contentEl.tagName.toLowerCase();
			const elementPreHandleResult = elementPreHandle?.(contentEl);
			if (elementPreHandleResult) {
				const { substringCount, elWithContentFound: foundEl } = elementPreHandleResult;
				if (count + substringCount - 1 >= highlightFragmentIndex) {
					return foundEl;
				}
				count += substringCount;
			}

			let textContent: string | undefined;
			if (tagName === "svg") {
				// svg text nodes are not included in innerText
				textContent = Array.from(contentEl.querySelectorAll(textSelector))
					.map((text) => text.textContent ?? "")
					.join("\n");
			} else {
				textContent = contentEl.innerText;
			}

			const substringCount = findSubstringCountForSearchFragment(textContent, highlightFragment);

			if (count + substringCount - 1 >= highlightFragmentIndex) {
				let foundEl = contentEl;

				const overrideResult = overrideHighlightElement(foundEl);

				if (overrideResult.overrode) foundEl = overrideResult.overrideEl;
				else if (tagName === "svg")
					// svg parent needed so the whole diagram can be highlighted
					foundEl = foundEl.parentElement?.parentElement ?? foundEl.parentElement ?? foundEl;
				else if (!tagNamesToDontSearchInside.includes(tagName) && contentEl.children.length > 0)
					foundEl = findElementWithFragmentRecursively(
						contentEl.children as HTMLCollectionOf<HTMLElement>,
						count,
					);
				return foundEl;
			}

			count += substringCount;
		}

		return undefined;
	};

	const contentEls = articleContentWrapper?.children as HTMLCollectionOf<HTMLElement> | undefined;
	return contentEls ? findElementWithFragmentRecursively(contentEls, 0) : undefined;
}

function findSubstringCountForSearchFragment(str: string, substr: string) {
	if (!str) return 0;
	const escapedSubstr = substr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const matches = str.match(new RegExp(escapedSubstr, "gi"));
	return matches ? matches.length : 0;
}

function getCssSelectorShort(el: HTMLElement, rootEl: HTMLElement) {
	const path: string[] = [];
	let current = el;
	let parent = current.parentNode;

	while (parent) {
		const tag = current.tagName;

		if (current.id) path.unshift(`#${current.id}`);
		else {
			const childrenArray = Array.from(parent.children);
			const elemsWithSameTagCount = childrenArray.filter((sibling) => sibling.tagName === tag).length;
			if (elemsWithSameTagCount === 1) path.unshift(tag);
			else path.unshift(`${tag}:nth-child(${1 + childrenArray.indexOf(current)})`);
		}

		if (parent === rootEl) break;

		current = parent as HTMLElement;
		parent = current.parentNode;
	}

	return `${path.join(" > ")}`.toLowerCase();
}

function highlightElements(els: HTMLElement[], setAnimation: (el: HTMLElement[]) => void) {
	let animationStarted = false;

	const tryStartAnimation = () => {
		if (!animationStarted && document.visibilityState === "visible") {
			setAnimation(els);
			animationStarted = true;
			document.removeEventListener("visibilitychange", tryStartAnimation);
		}
	};

	tryStartAnimation();

	if (!animationStarted) {
		document.addEventListener("visibilitychange", tryStartAnimation);
	}
}

async function waitRenderedElements() {
	// waiting for elements to be rendered (diagrams for example)
	// TODO: better solution
	await new Promise((resolve) => setTimeout(resolve, 200));
}
