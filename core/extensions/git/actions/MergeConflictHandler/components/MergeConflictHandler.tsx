import Button from "@components/Atoms/Button/Button";
import FileInput from "@components/Atoms/FileInput/FileInput";
import getCodeLensDefaultText from "@components/Atoms/FileInput/getCodeLenseDefaultText";
import getFileInputDefaultLanguage from "@components/Atoms/FileInput/getFileInputDefaultLanguage";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LeftNavViewContent from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import Sidebar from "@components/Layouts/Sidebar";
import FileInputMergeConflict, {
	CodeLensText,
} from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";
import { GitMarkers } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import getCodeLensReversedText from "@ext/git/actions/MergeConflictHandler/error/logic/getCodeLensReversedText";
import reverseMergeStatus from "@ext/git/actions/MergeConflictHandler/logic/GitMergeStatusReverse";
import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";
import t from "@ext/localization/locale/translate";
import { editor } from "monaco-editor";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import SidebarArticleLink from "../../Publish/components/SidebarArticleLink";
import { GitMergeResultContent } from "../model/GitMergeResultContent";
import haveConflictWithFileDelete from "@ext/git/actions/MergeConflictHandler/logic/haveConflictWithFileDelete";

interface MergeFileModel {
	mergeFile: GitMergeResultContent;
	haveMerges: boolean;
	editorState: {
		textModel: editor.IModel;
		viewState: editor.ICodeEditorViewState;
	};
}

const makeDeleteConflictContent = (content: string): string => {
	return `${GitMarkers.startHeader} Deleted content\n\n${GitMarkers.splitter}\n${content}\n${GitMarkers.endFooter} Added content`;
};

const initMergeFilesModel = (mergeFiles: GitMergeResultContent[]): MergeFileModel[] => {
	return mergeFiles
		.filter((f) => f.status !== GitMergeStatus.BothDeleted)
		.map((f) => {
			const isConflictWithFileDelete = haveConflictWithFileDelete(f.status);
			const content = isConflictWithFileDelete ? makeDeleteConflictContent(f.content) : f.content;
			return {
				mergeFile: { ...f, content },
				haveMerges: true,
				editorState: { textModel: null, viewState: null },
			};
		});
};

const getCodeLensText = (type: GitMergeStatus, reverseMerge: boolean): CodeLensText => {
	type = reverseMerge ? reverseMergeStatus(type) : type;
	const codeLensText = reverseMerge ? getCodeLensReversedText() : getCodeLensDefaultText();
	switch (type) {
		case GitMergeStatus.AddedByThem:
			return {
				...codeLensText,
				mergeWithDeletionHeader: t("git.merge.conflict.added-by-them"),
			};
		case GitMergeStatus.AddedByUs:
			return {
				...codeLensText,
				mergeWithDeletionHeader: t("git.merge.conflict.added-by-us"),
			};
		case GitMergeStatus.DeletedByThem:
			return {
				...codeLensText,
				mergeWithDeletionHeader: t("git.merge.conflict.deleted-by-them"),
			};
		case GitMergeStatus.DeletedByUs:
			return {
				...codeLensText,
				mergeWithDeletionHeader: t("git.merge.conflict.deleted-by-us"),
			};
		default:
			return codeLensText;
	}
};

const MergeConflictHandler = ({
	rawFiles,
	onMerge,
	reverseMerge,
}: {
	rawFiles: GitMergeResultContent[];
	onMerge: (result: GitMergeResultContent[]) => void;
	reverseMerge: boolean;
}) => {
	const [mergeFilesModel] = useState<MergeFileModel[]>(() => initMergeFilesModel(rawFiles));
	const currentIdx = useRef(0);

	const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
	const monacoRef = useRef<typeof monaco>(null);
	const fileInputMergeConflictRef = useRef<FileInputMergeConflict>(null);

	const [isAllMergesResolved, setIsAllMergesResolved] = useState(false);

	const currentOnMerge = () => {
		onMerge(mergeFilesModel.map((m) => m.mergeFile));
	};

	useEffect(() => {
		const keydownHandler = (e: KeyboardEvent) => {
			if (e.code === "Enter" && (e.ctrlKey || e.metaKey) && isAllMergesResolved) currentOnMerge();
		};

		document.addEventListener("keydown", keydownHandler, false);
		return () => {
			document.removeEventListener("keydown", keydownHandler, false);
		};
	}, [isAllMergesResolved]);

	return (
		<LeftNavViewContent
			onLeftSidebarClick={(idx) => {
				const prevIdx = currentIdx.current;
				currentIdx.current = idx;

				const mergeModelBefore = mergeFilesModel[prevIdx];
				mergeModelBefore.editorState.viewState = editorRef.current.saveViewState();

				const currentMergeModel = mergeFilesModel[idx];

				if (fileInputMergeConflictRef.current) {
					const isConflictWithFileDelete = haveConflictWithFileDelete(currentMergeModel.mergeFile.status);
					fileInputMergeConflictRef.current.haveConflictWithFileDelete = isConflictWithFileDelete;
					fileInputMergeConflictRef.current.codeLensText = getCodeLensText(
						currentMergeModel.mergeFile.status,
						reverseMerge,
					);
				}

				if (currentMergeModel.editorState.textModel) {
					editorRef.current.setModel(currentMergeModel.editorState.textModel);
					fileInputMergeConflictRef.current?.onChange();
					editorRef.current.restoreViewState(currentMergeModel.editorState.viewState);
					editorRef.current.focus();
					return;
				}

				currentMergeModel.editorState.textModel = monacoRef.current.editor.createModel(
					currentMergeModel.mergeFile.content,
					getFileInputDefaultLanguage(),
				);
				editorRef.current.setModel(currentMergeModel.editorState.textModel);
				editorRef.current.focus();
				fileInputMergeConflictRef.current?.onChange();
			}}
			elements={mergeFilesModel.map((model) => {
				return {
					leftSidebar: (
						<div style={{ padding: "1rem" }}>
							<Sidebar title={model.mergeFile.title} />
							<SidebarArticleLink filePath={{ path: model.mergeFile.path }} />
						</div>
					),
				};
			})}
			commonContent={
				<FileInput
					loading={<SpinnerLoader />}
					value={mergeFilesModel[0].mergeFile.content}
					height={"100%"}
					onChange={(value) => {
						mergeFilesModel[currentIdx.current].mergeFile.content = value;
						const mergeConflictDescriptor =
							fileInputMergeConflictRef.current?.mergeConfilctDescriptor ?? [];
						mergeFilesModel[currentIdx.current].haveMerges = !!mergeConflictDescriptor.length;
						setIsAllMergesResolved(mergeFilesModel.map((x) => x.haveMerges).every((x) => !x));
					}}
					onMount={(e, m, fileInputMergeConflict) => {
						editorRef.current = e;
						monacoRef.current = m;
						fileInputMergeConflictRef.current = fileInputMergeConflict;

						mergeFilesModel[0].editorState.textModel = e.getModel();
						mergeFilesModel[0].editorState.viewState = e.saveViewState();
						e.focus();

						if (fileInputMergeConflictRef.current) {
							const isConflictWithFileDelete = haveConflictWithFileDelete(
								mergeFilesModel[0].mergeFile.status,
							);
							fileInputMergeConflictRef.current.haveConflictWithFileDelete = isConflictWithFileDelete;
							fileInputMergeConflictRef.current.codeLensText = getCodeLensText(
								mergeFilesModel[0].mergeFile.status,
								reverseMerge,
							);
						}
					}}
				/>
			}
			sideBarBottom={
				<div style={{ padding: "1rem" }}>
					<Button fullWidth disabled={!isAllMergesResolved} onClick={currentOnMerge}>
						<span>{t("confirm")}</span>
					</Button>
				</div>
			}
		/>
	);
};

export default MergeConflictHandler;
