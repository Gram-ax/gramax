import ArticleExtensions from "@components/Article/ArticleExtensions";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { Extensions, JSONContent } from "@tiptap/react";
import { useState } from "react";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import CustomArticleEditor from "@ext/articleProvider/components/CustomArticleEditor";
import { GetExtensionsPropsOptions } from "@ext/markdown/core/edit/logic/getExtensions";
import { MainMenuOptions } from "@ext/markdown/core/edit/components/Menu/Menus/Main";
import BaseArticleBreadcrumb from "@ext/articleProvider/components/BaseArticleBreadcrumb";

interface BaseArticleViewProps {
	providerType: ArticleProviderType;
	item: ProviderItemProps;
	onUpdate: (id: string, content: JSONContent, title: string) => void;
	onCloseClick: () => void;
	extensions?: Extensions;
	extensionsOptions?: GetExtensionsPropsOptions;
	menuOptions?: MainMenuOptions;
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
								title={item.title}
								content={content}
								id={item.id}
								providerType={providerType}
								extensions={extensions}
								extensionsOptions={extensionsOptions}
								menuOptions={menuOptions}
								onUpdate={onUpdate}
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
