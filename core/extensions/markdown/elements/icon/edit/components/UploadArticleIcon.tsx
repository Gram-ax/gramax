import { MAX_ICON_SIZE } from "@app/config/const";
import t from "@ext/localization/locale/translate";
import { useCallback, useMemo } from "react";
import { type FileValue, type FileMetadata, FileUploadCompact } from "@ui-kit/FileUpload";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import Path from "@core/FileProvider/Path/Path";
import { formatBytes } from "@core-ui/utils/formatBytes";

export const useUploadIcon = (form: UseFormReturn<FormData>) => {
	const onAddFile = useCallback(
		async (files: FileValue[]) => {
			await files.forEachAsync(async (file) => {
				if (file instanceof File) {
					if (file.type !== "image/svg+xml") return;
					if (file.size > MAX_ICON_SIZE) return;
					const svg = await file.text();
					form.setValue("icons", [
						...form.getValues("icons"),
						{ name: new Path(file.name).name, content: svg, size: file.size, type: "image/svg+xml" },
					]);
				}
			});
		},
		[form],
	);

	const onRemoveFile = useCallback(
		(file: FileValue, index: number) => {
			const icons = form.getValues("icons");
			const newIcons = icons.slice(0, index).concat(icons.slice(index + 1));
			form.setValue("icons", newIcons);
		},
		[form],
	);

	const errorMessages = useMemo(
		() => ({
			fileTooLarge: (fileName: string, maxSizeBytes: number) =>
				t("file-upload.file-too-large")
					.replace("${fileName}", fileName)
					.replace("${maxSizeBytes}", formatBytes(maxSizeBytes)),
			invalidFileType: (fileName: string) => t("file-upload.invalid-file-type").replace("${fileName}", fileName),
			tooManyFiles: (maxFiles: number) => t("file-upload.too-many-files").replace("${maxFiles}", maxFiles),
			someFilesTooLarge: (maxSizeBytes: number) =>
				t("file-upload.some-files-too-large").replace("${maxSizeBytes}", formatBytes(maxSizeBytes)),
			singleFileTooLarge: (maxSizeBytes: number) =>
				t("file-upload.single-file-too-large").replace("${maxSizeBytes}", formatBytes(maxSizeBytes)),
		}),
		[],
	);

	return { onAddFile, onRemoveFile, errorMessages };
};

const UploadArticleIcon = ({ form }: { form: UseFormReturn<FormData> }) => {
	const { onAddFile, onRemoveFile, errorMessages } = useUploadIcon(form);
	const files = form.watch("icons");

	return (
		<FileUploadCompact
			initialFiles={files as FileMetadata[]}
			title={`${t("upload")} ${t("forms.catalog-edit-props.props.icons.name").toLowerCase()}`}
			description={t("forms.catalog-edit-props.props.icons.fileConditions")}
			errorMessages={errorMessages}
			files={files as FileValue[]}
			onAdd={onAddFile}
			onRemove={onRemoveFile}
			maxSize={MAX_ICON_SIZE}
			accept=".svg"
		/>
	);
};

export default UploadArticleIcon;
