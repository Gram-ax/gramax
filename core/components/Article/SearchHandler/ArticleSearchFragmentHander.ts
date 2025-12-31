import { noteFoundElementBeforeHighlightHandler } from "../../../extensions/markdown/elements/note/render/component/Note";
import { tabsFoundElementBeforeHighlightHandler } from "../../../extensions/markdown/elements/tabs/render/component/Tabs";

type BeforeHighlightHandler = (el: HTMLElement) => { additionalElementsToHighlight?: HTMLElement[] } | void;

const beforeHighlightHandlers: BeforeHighlightHandler[] = [
	tabsFoundElementBeforeHighlightHandler,
	noteFoundElementBeforeHighlightHandler,
];

function getHighlightFragmentFromUrl() {
	const currentUrl = new URL(document.URL);
	const highlightFragment = currentUrl.searchParams.get("highlightFragment");
	const highlightFragmentIndex = parseInt(currentUrl.searchParams.get("highlightFragmentIndex"));
	return { highlightFragment, highlightFragmentIndex };
}

export function highlightFragmentInEditorByUrl() {
	const { highlightFragment, highlightFragmentIndex } = getHighlightFragmentFromUrl();
	highlightFragmentInEditor(highlightFragment, highlightFragmentIndex);
}

export function highlightFragmentInEditor(highlightFragment: string, highlightFragmentIndex: number) {
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
			let elementsWithAnimationPlaying = 0;

			for (const el of els) {
				//TODO: small duplication with global.css.
				styleContent += `
					${promiseMirrorElSelector} > ${getCssSelectorShort(el, articleContentWrapper)} {
						animation: BLINK_ANIMATION 1.5s forwards linear;
					}
				`;
				elementsWithAnimationPlaying++;
				el.addEventListener("animationend", () => {
					elementsWithAnimationPlaying--;
					if (elementsWithAnimationPlaying === 0) styleEl.innerHTML = "";
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
		},
	);
}

export async function highlightFragmentInDocportalByUrl(waitBeforeCheckMs: number | undefined) {
	if (typeof document === "undefined") return;
	if (waitBeforeCheckMs) {
		await new Promise((resolve) => setTimeout(resolve, waitBeforeCheckMs));
	}

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

function highlightSearchFragment(
	highlightFragment: string,
	highlightFragmentIndex: number,
	articleContentWrapper: Element,
	setAnimation: (el: HTMLElement[]) => void,
	overrideHighlightElement: OverrideHighlightElement,
	elementPreHandle?: ElementPreHandle,
) {
	if (highlightFragment && !isNaN(highlightFragmentIndex)) {
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
		prevElementsFragmentCount: number,
	): HTMLElement | undefined => {
		const tagNamesToDontSearchInside = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];

		for (const contentEl of contentEls) {
			const elementPreHandleResult = elementPreHandle?.(contentEl);
			if (elementPreHandleResult) {
				const { substringCount, elWithContentFound: foundEl } = elementPreHandleResult;
				if (prevElementsFragmentCount + substringCount - 1 >= highlightFragmentIndex) {
					return foundEl;
				}
				prevElementsFragmentCount += substringCount;
			}

			const textContent = contentEl.textContent;
			const substringCount = findSubstringCountForSearchFragment(textContent, highlightFragment);

			if (prevElementsFragmentCount + substringCount - 1 >= highlightFragmentIndex) {
				let foundEl = contentEl;

				const overrideResult = overrideHighlightElement(foundEl);

				if (overrideResult.overrode) foundEl = overrideResult.overrideEl;
				else if (!tagNamesToDontSearchInside.includes(foundEl.tagName) && contentEl.children.length > 0)
					foundEl = findElementWithFragmentRecursively(
						contentEl.children as HTMLCollectionOf<HTMLElement>,
						prevElementsFragmentCount,
					);
				return foundEl;
			}

			prevElementsFragmentCount += substringCount;
		}

		return undefined;
	};

	const contentEls = articleContentWrapper?.children as HTMLCollectionOf<HTMLElement> | undefined;
	return contentEls ? findElementWithFragmentRecursively(contentEls, 0) : undefined;
}

function findSubstringCountForSearchFragment(str: string, substr: string) {
	const escapedSubstr = substr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const matches = str.match(new RegExp(escapedSubstr, "gi"));
	return matches ? matches.length : 0;
}

function getCssSelectorShort(el: HTMLElement, rootEl: HTMLElement) {
	const path: string[] = [];
	let parent: ParentNode | null;

	while ((parent = el.parentNode)) {
		const tag = el.tagName;

		if (el.id) path.unshift(`#${el.id}`);
		else {
			const childrenArray = Array.from(parent.children);
			const elemsWithSameTagCount = childrenArray.filter((sibling) => sibling.tagName === tag).length;
			if (elemsWithSameTagCount === 1) path.unshift(tag);
			else path.unshift(`${tag}:nth-child(${1 + childrenArray.indexOf(el)})`);
		}

		if (parent === rootEl) break;

		el = parent as HTMLElement;
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
