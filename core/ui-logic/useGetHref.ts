import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { usePlatform } from "@core-ui/hooks/usePlatform";

const useGetHref = (href: string) => {
	const { isStatic, isStaticCli } = usePlatform();
	if (!isStatic && !isStaticCli) return href;
	const logicPath = ArticlePropsService.value.logicPath;
	return logicPath + href;
};

export default useGetHref;
