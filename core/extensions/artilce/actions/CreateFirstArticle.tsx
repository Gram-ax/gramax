import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
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

	const isEdit = IsEditService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
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

	if (!isEdit) return null;

	return (
		<Button className={className} buttonStyle={ButtonStyle.default} onClick={onClickHandler}>
			<Icon code="plus" viewBox="3 3 18 18" isLoading={isLoading} />
			<span>{t("article.create.title")}</span>
		</Button>
	);
};

export default CreateFirstArticle;
