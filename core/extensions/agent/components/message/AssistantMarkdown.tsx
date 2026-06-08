import SimpleMarkdownParser from "@ext/markdown/core/Parser/SimpleMarkdownParser";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import { Prose } from "@ui-kit/Prose";
import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";

const markdownParser = new SimpleMarkdownParser();

type Props = {
	text: string;
	className?: string;
};

export function AssistantMarkdown({ text, className }: Props) {
	const [renderTree, setRenderTree] = useState<RenderableTreeNodes | null>(null);
	const components = useMemo(() => getComponents(), []);

	useEffect(() => {
		let disposed = false;
		if (!text.trim()) {
			setRenderTree(null);
			return;
		}
		void markdownParser
			.parse(text)
			.then((tree: RenderableTreeNodes) => {
				if (!disposed) {
					setRenderTree(tree);
				}
			})
			.catch(() => {
				if (!disposed) {
					setRenderTree(null);
				}
			});
		return () => {
			disposed = true;
		};
	}, [text]);

	if (!renderTree) {
		return (
			<div className={clsx("whitespace-pre-wrap wrap-break-word text-sm text-primary-fg", className)}>{text}</div>
		);
	}

	return (
		<div className={clsx("min-w-0 bg-transparent", className)}>
			<div
				className={clsx(
					"min-w-0",
					"[&_article_p]:m-0",
					"[&_article_ul]:m-0",
					"[&_article_ol]:m-0",
					"[&_article_p]:leading-snug",
					"[&_article_ul]:leading-snug",
					"[&_article_ol]:leading-snug",
					"[&_table]:block",
					"[&_table]:overflow-x-auto",
					"[&_table]:max-w-full",
					className,
				)}
			>
				<Prose className="text-sm leading-snug">{Renderer(renderTree, { components })}</Prose>
			</div>
		</div>
	);
}
