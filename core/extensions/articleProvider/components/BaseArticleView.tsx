import ArticleExtensions from "@components/Article/ArticleExtensions";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import BaseArticleBreadcrumb from "@ext/articleProvider/components/BaseArticleBreadcrumb";
import CustomArticleEditor from "@ext/articleProvider/components/CustomArticleEditor";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import { ToolbarMenuProps } from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import { GetExtensionsPropsOptions } from "@ext/markdown/core/edit/logic/getExtensions";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { Extensions, JSONContent } from "@tiptap/react";
import { useState } from "react";

interface BaseArticleViewProps {
	providerType: ArticleProviderType;
	item: ProviderItemProps;
	onUpdate: (id: string, content: JSONContent, title: string) => void;
	onCloseClick: () => void;
	extensions?: Extensions;
	extensionsOptions?: GetExtensionsPropsOptions;
	menuOptions?: ToolbarMenuProps;
}

const ContainerWrapper = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`;

const StyledWrapper = styled.div`
	flex: 1 1 0px;
	display: flex;
	gap: 1rem;
	flex-direction: row;
	margin-top: -0.1rem;

	> div:first-of-type {
		width: 100%;
	}
`;

const BaseArticleView = (props: BaseArticleViewProps) => {
	const { providerType, item, onUpdate, onCloseClick, extensions = [], extensionsOptions, menuOptions } = props;
	const [content, setContent] = useState<JSONContent>(null);
	const [isLoading, setIsLoading] = useState(true);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchContent = async () => {
		setIsLoading(true);
		const res = await FetchService.fetch(apiUrlCreator.getEditTreeInGramaxDir(item.id, providerType));
		if (!res.ok) return setIsLoading(false);

		const json = await res.json();
		const article = getArticleWithTitle(item.title, json);
		setContent(article);
		setIsLoading(false);
	};

	const fetchData = async () => {
		await fetchContent();
	};

	useWatch(() => {
		fetchData();
	}, [item.id]);

	return (
		<ContainerWrapper>
			<StyledWrapper>
				<div>
					{isLoading ? (
						<SpinnerLoader />
					) : (
						<>
							<BaseArticleBreadcrumb onCloseClick={onCloseClick} />
							<CustomArticleEditor
								content={content}
								extensions={extensions}
								extensionsOptions={extensionsOptions}
								id={item.id}
								menuOptions={menuOptions}
								onUpdate={onUpdate}
								providerType={providerType}
								title={item.title}
							/>
						</>
					)}
				</div>
			</StyledWrapper>
			<ArticleExtensions id={ContentEditorId} />
		</ContainerWrapper>
	);
};

export default BaseArticleView;
