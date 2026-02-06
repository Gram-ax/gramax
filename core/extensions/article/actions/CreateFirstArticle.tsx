import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import { useRouter } from "../../../logic/Api/useRouter";

interface CreateArticleProps {
	className?: string;
	data: ArticlePageData;
	onCreate?: () => void;
}

const CreateFirstArticle = (props: CreateArticleProps) => {
	const { className, onCreate } = props;
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const url = apiUrlCreator.createArticle(props.data.rootRef?.path);

	const onClickHandler = () => {
		setIsLoading(true);
		FetchService.fetch(url).then(async (response) => {
			if (!response.ok) return refreshPage();
			onCreate?.();
			router.pushPath(await response.text());
		});
		setIsLoading(false);
	};

	if (isReadOnly) return null;

	return (
		<Button buttonStyle={ButtonStyle.default} className={className} onClick={onClickHandler}>
			<Icon code="plus" isLoading={isLoading} viewBox="3 3 18 18" />
			<span>{t("article.create.title")}</span>
		</Button>
	);
};

export default CreateFirstArticle;
