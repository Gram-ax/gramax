import { deleteProperty } from "@ext/properties/logic/changeProperty";
import { updateProperty } from "@ext/properties/logic/changeProperty";
import { Property, ViewRenderData, ViewRenderGroup } from "@ext/properties/models";

const getCurrentGroup = (data: ViewRenderGroup[], groups: string[]): ViewRenderGroup[] => {
	let currentGroup = data;

	for (let i = 0; i < groups.length; i++) {
		const groupIndex = currentGroup.findIndex((group) => group.group?.[0] === groups[i]);
		if (groupIndex === -1) break;
		currentGroup = currentGroup[groupIndex].subgroups || [];

		if (i === groups.length - 1) break;
	}

	return currentGroup;
};

const getTargetGroup = (data: ViewRenderGroup[], value: string, article: ViewRenderData): ViewRenderGroup => {
	let targetGroup = data.find((group) => group.group?.[0] === value);
	if (targetGroup) {
		const targetSubGroup = targetGroup.subgroups[0];
		targetSubGroup.articles.push(article);
		return;
	}

	targetGroup = { group: [value], subgroups: [{ group: [], articles: [] }], articles: [] };
	const targetSubGroup = targetGroup.subgroups[0];
	targetSubGroup.articles.push(article);

	return targetGroup;
};

const updateListData = (
	data: ViewRenderGroup[],
	articlePath: string,
	groups: string[],
	groupby: string[],
	catalogProperties: Map<string, Property>,
	propertyName: string,
	value: string,
	isDelete?: boolean,
) => {
	const newData = [...data];
	const currentGroup = getCurrentGroup(newData, groups);

	const articleIndex = currentGroup[0]?.articles?.findIndex((article) => article.itemPath === articlePath);
	if (articleIndex === -1) return newData;

	const [article] = currentGroup[0].articles.splice(articleIndex, 1);

	const newProps = isDelete
		? deleteProperty(propertyName, article.otherProps, true)
		: updateProperty(propertyName, value, catalogProperties, article.otherProps, true);
	article.otherProps = newProps as Property[];

	if (groupby.includes(propertyName) && !isDelete) {
		const targetGroup = getTargetGroup(newData, value, article);
		if (targetGroup) newData.push(targetGroup);
	} else currentGroup[0].articles.splice(articleIndex, 0, article);

	if (currentGroup[0].articles.length === 0) {
		const parentGroupIndex = newData.findIndex((group) => group.group?.[0] === groups[groups.length - 1]);
		if (parentGroupIndex !== -1) newData.splice(parentGroupIndex, 1);
	}

	return newData;
};

export default updateListData;
