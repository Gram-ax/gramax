import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import InputFile from "@components/Atoms/InputFile";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import ResourceService, { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem, ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { ChangeEvent, useCallback } from "react";
import createFile from "../logic/createFile";

interface FileMenuButtonProps {
	editor: Editor;
	onStart?: () => void;
	onSave?: () => void;
}

interface FileInputProps extends Pick<FileMenuButtonProps, "editor" | "onSave"> {
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
	children: JSX.Element;
}

const FileInput = ({ editor, onSave, apiUrlCreator, resourceService, children }: FileInputProps) => {
	const onAbort = useCallback(() => {
		onSave?.();
	}, [onSave]);

	const onChange = useCallback(
		async (event: ChangeEvent<HTMLInputElement>) => {
			const filesArray = Array.from(event.currentTarget.files);
			await createFile(filesArray, editor.view, apiUrlCreator, resourceService);
			event.target.value = "";
			onSave?.();
		},
		[editor.view, apiUrlCreator, resourceService, onSave],
	);

	return (
		<InputFile className="flex flex-row items-center w-full cursor-pointer" onAbort={onAbort} onChange={onChange}>
			{children}
		</InputFile>
	);
};

export const FileMenuButton = ({ editor, onStart, onSave }: FileMenuButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const rs = ResourceService.value;

	const { disabled, isActive } = ButtonStateService.useCurrentAction({ mark: "file" });
	return (
		<ToolbarToggleButton
			active={isActive}
			data-qa={`qa-edit-menu-file`}
			disabled={disabled}
			focusable
			onSelect={(e) => {
				e.preventDefault();
				onStart?.();
				ArticleUpdaterService.stopLoadingAfterFocus();
			}}
			tooltipText={t("file")}
		>
			<FileInput apiUrlCreator={apiUrlCreator} editor={editor} onSave={onSave} resourceService={rs}>
				<ToolbarIcon icon="file" />
			</FileInput>
		</ToolbarToggleButton>
	);
};

export const FileMenuButtonDropdown = ({ editor, onStart, onSave }: FileMenuButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const rs = ResourceService.value;

	const { disabled, isActive } = ButtonStateService.useCurrentAction({ mark: "file" });

	if (disabled) {
		return (
			<ToolbarDropdownMenuItem
				active={isActive}
				dataQa={`qa-edit-menu-file`}
				disabled={disabled}
				onSelect={() => ArticleUpdaterService.stopLoadingAfterFocus()}
			>
				<div className="flex flex-row items-center gap-2 w-full">
					<Icon icon="file" />
					{t("file")}
				</div>
			</ToolbarDropdownMenuItem>
		);
	}

	return (
		<ToolbarDropdownMenuItem
			active={isActive}
			dataQa={`qa-edit-menu-file`}
			disabled={disabled}
			onSelect={(e) => {
				e.preventDefault();
				onStart?.();
				ArticleUpdaterService.stopLoadingAfterFocus();
			}}
		>
			<FileInput apiUrlCreator={apiUrlCreator} editor={editor} onSave={onSave} resourceService={rs}>
				<div className="flex flex-row items-center gap-2 w-full">
					<Icon icon="file" />
					{t("file")}
				</div>
			</FileInput>
		</ToolbarDropdownMenuItem>
	);
};
