import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import DiffContent from "@components/Atoms/DiffContent";
import TooltipIfOverflow from "@core-ui/TooltipIfOverflow";
import { Header, HeaderText } from "@ext/git/core/Diff/components/ProseMirrorDiffLineContent";
import t from "@ext/localization/locale/translate";
import type { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import { forwardRef, useRef } from "react";

const DiffContentComponent = forwardRef<HTMLDivElement, { changes: DiffHunk[]; unchangedColor?: string }>(
	({ changes, unchangedColor }: { changes: DiffHunk[]; unchangedColor?: string }, ref) => (
		<DiffContent
			changes={changes}
			isCode={false}
			ref={ref}
			showDiff
			unchangedColor={unchangedColor ? { color: unchangedColor } : undefined}
			whiteSpace="nowrap"
		/>
	),
);

export const BreadcrumbDiffLine = ({ changes }: { changes: DiffHunk[] }) => {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const content = (
		<div className="article tooltip-article">
			<Header>
				<HeaderText>{t("diff.type.breadcrumb").toUpperCase()}</HeaderText>
			</Header>
			<div className="tooltip-size">
				<MinimizedArticleStyled>
					<div className={"article-body popup-article"}>
						<DiffContentComponent
							changes={changes}
							ref={wrapperRef}
							unchangedColor="var(--color-article-text)"
						/>
					</div>
				</MinimizedArticleStyled>
			</div>
		</div>
	);
	return (
		<TooltipIfOverflow childrenRef={wrapperRef} content={content} interactive>
			{content}
		</TooltipIfOverflow>
	);
};
