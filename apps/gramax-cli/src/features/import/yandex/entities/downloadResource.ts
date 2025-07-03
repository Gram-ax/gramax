import FetchActions from "../FetchActions";
import { getPathBySlug, getPathsFromMdLink, hasHttp } from "../utils";
import { Articles, Resource } from "./article";
import FileProvider from "./fileProvider";

class DownloadResource {
	constructor() {}

	calculateTotalResources(articles: Articles, itemIds: number[]): number {
		return itemIds.reduce((acc, itemId) => acc + (articles[itemId]?.resources?.length || 0), 0);
	}

	filterResourcesByType(resources: Resource[], types: string[]): any[] {
		return resources.filter(({ type }) => types.includes(type));
	}

	processDiagramResources(resources: Resource[], isIndex: boolean, logMessage: () => void) {
		for (const resource of resources) {
			const { src, content = "", slug } = resource;

			const { filePath } = getPathBySlug(slug, src, isIndex);

			try {
				if (typeof content === "string") FileProvider.writeFileAsync(content, filePath);
			} catch (e) {
				console.log(e);
			} finally {
				logMessage();
			}
		}
	}

	async processFileAndImageResources(
		resources: any[],
		articleName: string,
		isIndex: boolean,
		logMessage: () => void,
	) {
		for (const resource of resources) {
			const { folderPathWithoutHasChildren, httpSrc, folderPathToHasChildren, fileName, src } =
				getPathsFromMdLink(resource, articleName);

			const realEndPoint = hasHttp(resource.src) ? httpSrc : src;

			try {
				const stream = await FetchActions.downloadFile(realEndPoint);
				if (!stream) throw new Error("Body is null");

				await FileProvider.writeFile(
					stream,
					isIndex ? folderPathToHasChildren : folderPathWithoutHasChildren,
					fileName,
				);
			} catch (e) {
				console.log(e);
			} finally {
				logMessage();
			}
		}
	}
}

export default new DownloadResource();
