/** biome-ignore-all lint/complexity/noStaticOnlyClass: it's ok */
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import type { ClientArticleProps } from "../../logic/SitePresenter/SitePresenter";

/**
 * @deprecated Consider using `useArticlePropsStore(..)` hook instead
 */
abstract class ArticlePropsService {
	static get value(): ClientArticleProps {
		return useArticlePropsStore((state) => state?.data);
	}
}

export default ArticlePropsService;
