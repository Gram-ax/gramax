import styled from "@emotion/styled";
import { Property } from "csstype";
import { forwardRef, LegacyRef } from "react";
import { DiffHunk } from "../../extensions/VersionControl/DiffHandler/model/DiffHunk";
import { FileStatus } from "../../extensions/Watchers/model/FileStatus";
import Code from "./Code";

const DiffContent = (
	{
		showDiff,
		changes,
		isCode = true,
		className,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		whiteSpace,
	}: {
		showDiff: boolean;
		changes: DiffHunk[];
		addedColor?: Partial<{ color: Property.Color; background: Property.Color }>;
		removedColor?: Partial<{ color: Property.Color; background: Property.Color }>;
		unchangedColor?: Partial<{ color: Property.Color; background: Property.Color }>;
		whiteSpace?: Property.WhiteSpace;
		isCode?: boolean;
		className?: string;
	},
	ref: LegacyRef<HTMLDivElement>,
) => {
	if (changes.length == 0) return null;
	const content = showDiff ? changes : changes.filter((c) => c.type !== FileStatus.delete);

	return (
		<div className={className} ref={ref}>
			{content.map((c, idx) => {
				return isCode ? (
					<Code className={showDiff ? c.type ?? "common" : "common"} key={idx}>
						{c.value}
					</Code>
				) : (
					<span className={showDiff ? c.type ?? "common" : "common"} key={idx}>
						{c.value}
					</span>
				);
			})}
		</div>
	);
};

export default styled(forwardRef(DiffContent))`
	${(p) =>
		p.isCode === false
			? `
	span {
		font-family: "Roboto", sans-serif;
		box-decoration-break: clone;
		display: inline;
		padding: 0;
		white-space: ${p.whiteSpace ?? "pre-wrap"};
	}`
			: ""}

	.common, .modified {
		${(p) =>
			p.unchangedColor
				? `color: ${p.unchangedColor.color ?? "var(--color-body-text)"}; 
				background: ${p.unchangedColor.background ?? "#ffffff00"};`
				: `color: var(--color-body-text); background: #ffffff00;`}
	}

	.${FileStatus.new} {
		border-radius: 5px !important;
		${(p) =>
			p.addedColor
				? `color: ${p.addedColor.color ?? "var(--color-added-text)"}; 
				background: ${p.addedColor.background ?? "var(--color-added-bg)"};`
				: `color: var(--color-added-text); background: var(--color-added-bg)`}
	}

	.${FileStatus.delete} {
		border-radius: 5px;
		${(p) =>
			p.removedColor
				? `color: ${p.removedColor.color ?? "var(--color-removed-text)"}; 
				background: ${p.removedColor.background ?? "var(--color-removed-bg)"};`
				: `color: var(--color-removed-text); background: var(--color-removed-bg)`}
	}
`;
