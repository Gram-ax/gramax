import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import InputFile from "@components/Atoms/InputFile";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import createFile from "../logic/createFile";

const FileMenuButton = ({ editor, onSave }: { editor: Editor; onSave?: () => void }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const { disabled } = ButtonStateService.useCurrentAction({ mark: "file" });

	if (disabled) {
		return <Button icon="file" nodeValues={{ mark: "file" }} tooltipText={t("file")} />;
	}

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
				tooltipText={t("file")}
				onClick={() => ArticleUpdaterService.stopLoadingAfterFocus()}
			/>
		</InputFile>
	);
};

export default FileMenuButton;
