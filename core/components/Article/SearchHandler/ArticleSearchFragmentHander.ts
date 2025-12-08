import { noteFoundElementBeforeHighlightHandler } from "../../../extensions/markdown/elements/note/render/component/Note";
import { tabsFoundElementBeforeHighlightHandler } from "../../../extensions/markdown/elements/tabs/render/component/Tabs";

type BeforeHighlightHandler = (el: HTMLElement) => { additionalElementsToHighlight?: HTMLElement[] } | void;

const beforeHighlightHandlers: BeforeHighlightHandler[] = [
	tabsFoundElementBeforeHighlightHandler,
	noteFoundElementBeforeHighlightHandler,
];

type PlatformForHighlight = "editor" | "docportal";

export async function highlightSearchFragmentByUrl(
	waitBeforeCheckMs: number | undefined,
	platform: PlatformForHighlight,
) {
	if (typeof document === "undefined") return;
	if (waitBeforeCheckMs) {
		await new Promise((resolve) => setTimeout(resolve, waitBeforeCheckMs));
	}

	const currentUrl = new URL(document.URL);

	const highlightFragment = currentUrl.searchParams.get("highlightFragment");
	const highlightFragmentIndex = parseInt(currentUrl.searchParams.get("highlightFragmentIndex"));

	highlightSearchFragment(highlightFragment, highlightFragmentIndex, platform);
}

export function highlightSearchFragment(
	highlightFragment: string,
	highlightFragmentIndex: number,
	platform: PlatformForHighlight,
) {
	if (highlightFragment && !isNaN(highlightFragmentIndex)) {
		const articleBody = document.querySelector(".article-body");
		const articleContentWrapper =
			platform === "docportal"
				? articleBody.querySelector("article")
				: articleBody.querySelector(".tiptap.ProseMirror");
		const foundEl = findElementToHighlight(highlightFragment, highlightFragmentIndex, articleContentWrapper);

		if (foundEl) {
			const additionalElementsToHighlight: HTMLElement[] = [];
			beforeHighlightHandlers.forEach((handler) => {
				const handleResult = handler(foundEl);
				if (handleResult && handleResult.additionalElementsToHighlight)
					additionalElementsToHighlight.push(...handleResult.additionalElementsToHighlight);
			});

			if (platform === "docportal") highlightElements([foundEl, ...additionalElementsToHighlight]);

			foundEl.scrollIntoView({ block: "center", behavior: "auto" });
		}
	}
}

function findElementToHighlight(
	highlightFragment: string,
	highlightFragmentIndex: number,
	articleContentWrapper: Element,
) {
	const findSubstringCount = (str: string, substr: string) => {
		const escapedSubstr = substr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const matches = str.match(new RegExp(escapedSubstr, "gi"));
		return matches ? matches.length : 0;
	};

	const tagNamesToDontSearchInside = ["P", "H1", "H2", "H3", "H4", "H5", "H6"];

	const contentEls = articleContentWrapper.children as HTMLCollectionOf<HTMLElement>;

	const findElementWithFragmentRecursively = (
		contentEls: HTMLCollectionOf<HTMLElement>,
		prevElementsFragmentCount: number,
	): HTMLElement | undefined => {
		for (const contentEl of contentEls) {
			const textContent = contentEl.textContent;
			const substringCount = findSubstringCount(textContent, highlightFragment);

			if (prevElementsFragmentCount + substringCount - 1 >= highlightFragmentIndex) {
				let foundEl = contentEl;

				if (foundEl.tagName === "PRE") foundEl = foundEl.querySelector(".child-wrapper");
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

	return findElementWithFragmentRecursively(contentEls, 0);
}

function highlightElements(els: HTMLElement[]) {
	const className = "is-found-article-element";

	let animationStarted = false;

	const tryStartAnimation = () => {
		if (!animationStarted && document.visibilityState === "visible") {
			for (const el of els) {
				el.classList.add(className);
				el.addEventListener("animationend", () => {
					el.classList.remove(className);
				});
			}

			animationStarted = true;

			document.removeEventListener("visibilitychange", tryStartAnimation);
		}
	};

	tryStartAnimation();

	if (!animationStarted) {
		document.addEventListener("visibilitychange", tryStartAnimation);
	}
}
