import Code from "@components/Atoms/Code";
import styled from "@emotion/styled";
import { ParsedMergeFile } from "@ext/git/actions/MergeConflictHandler/model/MergeFile";
import { PartType } from "../../model/FileTypes";
import Resolver from "./Resolver/Resolver";

const MergeConflictChooser = styled(
	({
		parsedFile,
		onResolve,
		className,
	}: {
		parsedFile: ParsedMergeFile;
		onResolve: (parsedFile: ParsedMergeFile) => void;
		className?: string;
	}) => {
		return (
			<div className={className + " merge-conflictor"}>
				{parsedFile.parts.map((part, index) =>
					part.type === PartType.Conflict ? (
						<Resolver
							key={index}
							conflict={part}
							onClick={(conflict) => {
								const newParts = [...parsedFile.parts];
								newParts[index] = conflict;
								const newParsedFile: ParsedMergeFile = {
									...parsedFile,
									parts: newParts,
								};
								onResolve(newParsedFile);
							}}
						/>
					) : (
						<Code key={index} className="unconflicted-content">
							{part.content.trim()}
						</Code>
					),
				)}
			</div>
		);
	},
)`
	width: 100%;
	padding: 20px 0;
	color: var(--color-primary);
	background: var(--color-article-bg);

	.unconflicted-content {
		padding: 0 20px;
	}
`;

export default MergeConflictChooser;
