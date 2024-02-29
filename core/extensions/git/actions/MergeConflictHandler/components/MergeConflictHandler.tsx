import Button from "@components/Atoms/Button/Button";
import LeftNavViewContent from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import Sidebar from "@components/Layouts/Sidebar";
import { useEffect, useMemo, useState } from "react";
import useLocalize from "../../../../localization/useLocalize";
import SidebarArticleLink from "../../Publish/components/SidebarArticleLink";
import buildFile from "../logic/buildFile";
import parseRawFile from "../logic/parsePartedFile";
import { PartType } from "../model/FileTypes";
import { MergeFile, ParsedMergeFile } from "../model/MergeFile";
import MergeConflictChooser from "./Chooser/Chooser";

const MergeConflictHandler = ({
	rawFiles,
	onMerge,
}: {
	rawFiles: MergeFile[];
	onMerge: (result: MergeFile[]) => void;
}) => {
	const [parsedFiles, setParsedFiles] = useState<ParsedMergeFile[]>([]);
	const confirmText = useLocalize("confirm");
	const isAllMergesResolved = useMemo(
		() =>
			parsedFiles.every((file) =>
				file.parts.every((part) => {
					if (part.type === PartType.Normal) return true;
					return part.resolved;
				}),
			),
		[parsedFiles],
	);

	const currentOnMerge = () => {
		onMerge(
			parsedFiles.map((file) => ({
				...file,
				content: buildFile({ file }),
			})),
		);
	};

	useEffect(() => {
		if (JSON.stringify(rawFiles) == JSON.stringify(parsedFiles)) return;
		setParsedFiles(parseRawFile(rawFiles, true));
	}, [rawFiles]);

	const keydownHandler = (e: KeyboardEvent) => {
		if (e.code === "Enter" && (e.ctrlKey || e.metaKey) && isAllMergesResolved) currentOnMerge();
	};

	useEffect(() => {
		document.addEventListener("keydown", keydownHandler, false);
		return () => {
			document.removeEventListener("keydown", keydownHandler, false);
		};
	});

	return (
		parsedFiles.length && (
			<LeftNavViewContent
				elements={parsedFiles.map((parsedFile, idx) => {
					return {
						leftSidebar: (
							<div style={{ padding: "1rem" }}>
								<Sidebar title={parsedFile.title} />
								<SidebarArticleLink filePath={{ path: parsedFile.path }} />
							</div>
						),
						content: (
							<MergeConflictChooser
								parsedFile={parsedFile}
								onResolve={(parsedFile) => {
									const newParsedFiles = parsedFiles.slice();
									newParsedFiles[idx] = parsedFile;
									setParsedFiles(newParsedFiles);
								}}
							/>
						),
					};
				})}
				sideBarBottom={
					<div style={{ padding: "1rem" }}>
						<Button fullWidth disabled={!isAllMergesResolved} onClick={currentOnMerge}>
							<span>{confirmText}</span>
						</Button>
					</div>
				}
			/>
		)
	);
};

export default MergeConflictHandler;
