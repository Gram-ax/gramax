import LoaderText from "@ext/ai/components/LoaderText";
import { Decoration } from "@tiptap/pm/view";
import { createRoot } from "react-dom/client";

export const createLoadingDecoration = (
	from: number,
	to: number,
	block: boolean = false,
	text?: string,
): Decoration[] => {
	const decorations = [];

	if (block) {
		decorations.push(Decoration.node(from - 1, to + 1, { style: "position: relative;" }));

		decorations.push(
			Decoration.widget(from, () => {
				const wrapperDiv = document.createElement("div");
				wrapperDiv.style.position = "absolute";
				wrapperDiv.style.width = "100%";
				wrapperDiv.style.height = "2.25em";
				wrapperDiv.style.left = "0";
				wrapperDiv.style.top = "0";
				wrapperDiv.style.backgroundColor = "var(--color-article-bg)";

				const div = document.createElement("div");
				div.style.position = "relative";
				div.style.height = "100%";
				div.classList.add("skeleton-pulse");
				div.style.borderRadius = "var(--radius-small)";

				const root = createRoot(div);
				root.render(<LoaderText text={text} />);

				wrapperDiv.appendChild(div);
				return wrapperDiv;
			}),
		);
	}

	if (!block) {
		decorations.push(Decoration.inline(from, to, { class: "skeleton-pulse" }));
	}

	return decorations;
};
