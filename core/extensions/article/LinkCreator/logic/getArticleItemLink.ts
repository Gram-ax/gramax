import Path from "@core/FileProvider/Path/Path";
import { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";

const findMatchingLink = (links: CategoryLink[], currentLevels: string[]): CategoryLink => {
	for (const link of links) {
		const linkLevels = link.ref.path.split("/");

		const isMatch = currentLevels.every((level, index) => linkLevels[index] === level);

		if (isMatch) return link;

		if (link.items && link.items.length > 0) {
			const nestedMatch = findMatchingLink(link.items as CategoryLink[], currentLevels);
			if (nestedMatch) {
				return nestedMatch;
			}
		}
	}
};

const getArticleItemLink = (itemLinks: CategoryLink[] | ItemLink[], findPath: string): ItemLink => {
	const articlePath = new Path(findPath);
	const levels = articlePath.value.split("/");

	return findMatchingLink(itemLinks as CategoryLink[], levels);
};

export default getArticleItemLink;
