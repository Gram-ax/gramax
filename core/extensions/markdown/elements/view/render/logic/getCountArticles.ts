import { ViewRenderGroup } from "@ext/properties/models";

const getCountArticles = (subgroups: ViewRenderGroup[]): number => {
	return subgroups?.reduce((total, subgroup) => {
		const articlesCount = subgroup?.articles ? subgroup?.articles.length : 0;
		const nestedCount = subgroup?.subgroups ? getCountArticles(subgroup?.subgroups) : 0;
		return total + articlesCount + nestedCount;
	}, 0);
};

export default getCountArticles;
