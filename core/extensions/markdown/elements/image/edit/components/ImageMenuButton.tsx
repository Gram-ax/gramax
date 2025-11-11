import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import createImages from "../logic/createImages";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { ChangeEvent } from "react";

interface ImageMenuButtonProps {
	editor: Editor;
	className?: string;
	fileName?: string;
}

const ImageMenuButton = ({ editor, className, fileName }: ImageMenuButtonProps) => {
	const articleProps = ArticlePropsService.value;
	const resourceService = ResourceService.value;

	const { disabled } = ButtonStateService.useCurrentAction({ action: "image" });

	if (disabled) {
		return <Button icon="image" nodeValues={{ action: "image" }} tooltipText={t("image")} />;
	}

	const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
		await createImages(
			[...event.currentTarget.files],
			editor.view,
			fileName || articleProps?.fileName,
			resourceService,
		);
		event.target.value = "";
	};

	return (
		<Button
			tooltipText={t("image")}
			nodeValues={{ action: "image" }}
			onClick={() => ArticleUpdaterService.stopLoadingAfterFocus()}
		>
			<label className={className}>
				<input type="file" accept="image/*" onChange={onChange} />
				<Button icon="image" />
			</label>
		</Button>
	);
};

export default styled(ImageMenuButton)`
	position: relative;
	display: inline-block;

	input[type="file"] {
		position: absolute;
		z-index: var(--z-index-background);
		opacity: 0;
		display: block;
		width: 0;
		height: 0;
	}

	i {
		color: var(--color-article-bg);
	}
`;
