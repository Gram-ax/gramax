import styled from "@emotion/styled";
import { Property } from "csstype";
import { Change } from "../../extensions/VersionControl/DiffHandler/model/Change";
import { FileStatus } from "../../extensions/Watchers/model/FileStatus";
import Code from "./Code";
const DiffContent = styled(
	({
		showDiff,
		changes,
		isCode = true,
		className,
	}: {
		showDiff: boolean;
		changes: Change[];
		addedColor?: Partial<{ color: Property.Color; background: Property.Color }>;
		removedColor?: Partial<{ color: Property.Color; background: Property.Color }>;
		unchangedColor?: Partial<{ color: Property.Color; background: Property.Color }>;
		isCode?: boolean;
		className?: string;
	}) => {
		if (changes.length == 0) return null;
		const content = showDiff ? changes : changes.filter((c) => c.type !== FileStatus.delete);

		return (
			<div className={className}>
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
	},
)`
	${(p) =>
		p.isCode === false
			? `
	span {
		font-family: "Roboto", sans-serif;
		box-decoration-break: clone;
		display: inline;
		padding: 0;
		white-space: pre-wrap;
	}`
			: ""}

	.common {
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

export default DiffContent;
