import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";

class LinkCreator {
	isExternalLink(href: string): boolean {
		return !!(href?.match(/^#/) || href?.match(/^\w+:/) || href?.slice(1, 4) == "api");
		// вынести?
	}

	async getLink(
		href: string,
		context: ParserContext,
	): Promise<{
		href: string;
		hash: string;
		resourcePath: Path;
		isFile?: boolean;
	}> {
		if (this.isExternalLink(href)) return { href, resourcePath: null, hash: null };
		if (!href) return { href, resourcePath: null, hash: null };

		const hashAndPath = this.getHash(href);
		if (!hashAndPath) return { href, resourcePath: null, hash: null };

		const [, p, hash] = hashAndPath;
		const catalog = context.getCatalog();
		const basePath = context.getBasePath().value;
		const articlePath = context.getArticle().ref.path;
		const articleExtension = articlePath.extension;
		const docsPath = catalog.getRootCategoryRef().path.parentDirectoryPath;

		let hrefPath = this.getLinkPath(docsPath, docsPath.subDirectory(articlePath.parentDirectoryPath), p);
		let relativeHrefPath = articlePath.getRelativePath(hrefPath);
		let resourcePath = new Path(p);

		if (!hrefPath.extension) {
			const testHrefPath = new Path(hrefPath.value);
			testHrefPath.extension = articleExtension;
			if (context.getItemByPath(testHrefPath)) {
				hrefPath.extension = articleExtension;
				resourcePath.extension = articleExtension;
				relativeHrefPath = articlePath.getRelativePath(hrefPath);
			} else {
				const testIndexHrefPath = new Path(hrefPath.value).join(new Path(CATEGORY_ROOT_FILENAME));
				if (context.getItemByPath(testIndexHrefPath)) {
					hrefPath = testIndexHrefPath;
					relativeHrefPath = articlePath.getRelativePath(hrefPath);
				} else {
					return { href: hrefPath?.value ?? "", resourcePath, hash };
				}
			}
		}
		let isFile = false;
		if (hrefPath.extension !== articleExtension) {
			isFile = true;
			href = new ApiUrlCreator(basePath, null, catalog.getName(), articlePath.value)
				.getArticleResource(relativeHrefPath.value)
				.toString();
		} else {
			const item = context.getItemByPath(hrefPath);
			if (item) {
				const link = await context.getCatalog().getPathname(item);
				resourcePath = articlePath.getRelativePath(item.ref.path);
				href = link ? link : hrefPath?.stripExtension ?? "";
			} else {
				href = `${context.getCatalog().getName()}/${href}`;
			}
		}

		return { href, resourcePath, hash, isFile };
	}

	getHash(href: string) {
		return href.match(/^(.+?)(#.+)?$/);
	}

	getLinkPath(rootPath: Path, mainPath: Path, href: string): Path {
		return rootPath.parentDirectoryPath.join(
			rootPath.parentDirectoryPath.subDirectory(rootPath).join(mainPath).join(new Path(href)),
		);
	}
}
const linkCreator = new LinkCreator();

export default linkCreator;
