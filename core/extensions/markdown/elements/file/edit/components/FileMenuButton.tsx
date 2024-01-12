import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import InputFile from "@components/Atoms/InputFile";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import createFile from "../logic/createFile";

const FileMenuButton = ({ editor, onSave }: { editor: Editor; onSave?: () => void }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<InputFile
			onChange={async (event) => {
				const filesArray = Array.from(event.currentTarget.files);
				await createFile(filesArray, editor.view, apiUrlCreator);
				onSave?.();
			}}
		>
			<Button
				icon="file"
				nodeValues={{ mark: "file" }}
				tooltipText="Файл"
				onClick={() => ArticleUpdaterService.stopLoadingAfterFocus()}
			/>
		</InputFile>
	);
};

export default FileMenuButton;
