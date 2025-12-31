import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import createImages from "../logic/createImages";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { ChangeEvent, useCallback } from "react";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import { Icon } from "@ui-kit/Icon";
import InputFile from "@components/Atoms/InputFile";
import { cn } from "@core-ui/utils/cn";

interface ImageMenuButtonProps {
	editor: Editor;
	className?: string;
	fileName?: string;
	onSave?: () => void;
	onStart?: () => void;
}

const ImageMenuButton = ({ editor, className, fileName, onSave, onStart }: ImageMenuButtonProps) => {
	const articleProps = ArticlePropsService.value;
	const resourceService = ResourceService.value;

	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "image" });

	const onAbort = useCallback(() => {
		onSave?.();
	}, [onSave]);

	const onChange = useCallback(
		async (event: ChangeEvent<HTMLInputElement>) => {
			await createImages(
				[...event.currentTarget.files],
				editor.view,
				fileName || articleProps?.fileName,
				resourceService,
			);
			event.target.value = "";
			onSave?.();
		},
		[editor.view, fileName, articleProps?.fileName, resourceService, onSave],
	);

	if (disabled) {
		return (
			<ToolbarDropdownMenuItem
				dataQa={`qa-edit-menu-image`}
				disabled={disabled}
				active={isActive}
				onSelect={() => ArticleUpdaterService.stopLoadingAfterFocus()}
			>
				<div className="flex flex-row items-center gap-2 w-full">
					<Icon icon="image" />
					{t("image")}
				</div>
			</ToolbarDropdownMenuItem>
		);
	}

	return (
		<ToolbarDropdownMenuItem
			dataQa={`qa-edit-menu-image`}
			disabled={disabled}
			active={isActive}
			className={cn(className, "flex flex-row items-center gap-2 whitespace-nowrap")}
			onSelect={(e) => {
				e.preventDefault();
				onStart?.();
				ArticleUpdaterService.stopLoadingAfterFocus();
			}}
		>
			<InputFile
				className="flex flex-row items-center w-full cursor-pointer"
				onChange={onChange}
				onAbort={onAbort}
			>
				<div className="flex flex-row items-center gap-2 w-full">
					<Icon icon="image" />
					{t("image")}
				</div>
			</InputFile>
		</ToolbarDropdownMenuItem>
	);
};

export default styled(ImageMenuButton)`
	position: relative;

	input[type="file"] {
		position: absolute;
		z-index: var(--z-index-background);
		opacity: 0;
		display: block;
		width: 0;
		height: 0;
	}
`;
