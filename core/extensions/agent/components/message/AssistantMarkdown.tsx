import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import Anchor from "@components/controls/Anchor";
import { classNames } from "@components/libs/classNames";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import { cn } from "@core-ui/utils/cn";
import SimpleMarkdownParser from "@ext/markdown/core/Parser/SimpleMarkdownParser";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import { useEffect, useMemo, useState } from "react";

const simpleParser = new SimpleMarkdownParser();

type Props = {
	text: string;
	className?: string;
};

export const AssistantMarkdown = ({ text, className }: Props) => {
	const [renderTree, setRenderTree] = useState<RenderableTreeNodes | null>(null);
	const components = useMemo(() => ({ ...getComponents(), a: Anchor }), []);

	useEffect(() => {
		let disposed = false;
		if (!text.trim()) {
			setRenderTree(null);
			return;
		}

		void simpleParser
			.parse(text)
			.then((tree) => {
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
			<div
				className={cn(
					"whitespace-pre-wrap wrap-break-word text-sm text-primary-fg group-data-[gray]:!text-muted-foreground",
					className,
				)}
			>
				{text}
			</div>
		);
	}

	return (
		<div className="min-w-0 bg-transparent text-sm">
			<div
				className={cn("article group-data-[gray]:!text-muted-foreground", className)}
				style={{ background: "transparent" }}
			>
				<ArticleTooltipService.Provider>
					<MinimizedArticleStyled>
						<div className={classNames("article-body", {}, ["popup-article"])}>
							{Renderer(renderTree, { components })}
						</div>
					</MinimizedArticleStyled>
				</ArticleTooltipService.Provider>
			</div>
		</div>
	);
};
