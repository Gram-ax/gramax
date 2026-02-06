import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import camelToKebabCase from "@core-ui/camelToKebabCase";
import PublicApiUrlCreator from "@ext/publicApi/PublicApiUrlCreator";
import React from "react";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import ParserContext from "../../../Parser/ParserContext/ParserContext";

export enum unSupportedElements {
	tab = "Tab",
	openApi = "OpenApi",
	mermaid = "Mermaid",
	"db-diagram" = "Db-diagram",
	"plant-uml" = "PlantUml",
}

class HTMLComponents {
	private _publicApiUrlCreator: PublicApiUrlCreator;

	constructor(
		private _requestUrl: string,
		context: ParserContext,
	) {
		this._publicApiUrlCreator = new PublicApiUrlCreator(
			encodeURIComponent(context.getCatalog()?.name),
			context.getArticle()?.logicPath,
			context.getBasePath().value,
		);
	}

	public renderIcon({ code, ...props }: { code: string } & React.HTMLAttributes<HTMLElement> & Record<string, any>) {
		const IconComponent = LucideIcon(code) || LucideIcon("circle-help");

		return (
			<i {...props}>
				<IconComponent />
			</i>
		);
	}

	private _getApiArticle(link: string, hash?: string) {
		const url = this._publicApiUrlCreator.getApiArticle(link.replace(hash, ""), hash);
		return this._addRequestUrl(url.toString());
	}

	public getApiArticleResource(src: string) {
		const url = this._publicApiUrlCreator.getApiArticleResource(src);
		return this._addRequestUrl(url.toString());
	}

	private _addRequestUrl = (src: string) => {
		return src.slice(0, 4) == "http" ? src : this._requestUrl + Path.empty.join(new Path(src)).value;
	};

	public getNullComponent(name: unSupportedElements) {
		return (props) => {
			const content = camelToKebabCase(name);
			return React.createElement(content, {
				...props,
				...(props.src && {
					src: this.getApiArticleResource(props.src),
				}),
			});
		};
	}

	public getHref(resourcePath, isFile, hash, href) {
		const newHref = resourcePath
			? isFile
				? this.getApiArticleResource(resourcePath)
				: this._getApiArticle(href, hash)
			: href;
		return newHref;
	}
}

export default HTMLComponents;
