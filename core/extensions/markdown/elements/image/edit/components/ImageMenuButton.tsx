import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import styled from "@emotion/styled";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import createImages from "../logic/createImages";

const ImageMenuButton = styled(({ editor, className }: { editor: Editor; className?: string }) => {
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<Button
			tooltipText={"Изображение"}
			nodeValues={{ action: "image" }}
			onClick={() => ArticleUpdaterService.stopLoadingAfterFocus()}
		>
			<label className={className}>
				<input
					type="file"
					name="my-image"
					id="image"
					accept="image/*"
					onChange={(event) =>
						createImages([...event.currentTarget.files], editor.view, articleProps, apiUrlCreator)
					}
				/>
				<Button icon="image" />
			</label>
		</Button>
	);
})`
	cursor: pointer;
	position: relative;
	display: inline-block;

	input[type="file"] {
		position: absolute;
		z-index: -1;
		opacity: 0;
		display: block;
		width: 0;
		height: 0;
	}

	i {
		color: var(--color-article-bg);
	}
`;

export default ImageMenuButton;
