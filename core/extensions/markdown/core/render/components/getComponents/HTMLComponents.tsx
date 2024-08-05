import PublicApiUrlCreator from "@ext/publicApi/PublicApiUrlCreator";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import ParserContext from "../../../Parser/ParserContext/ParserContext";
import camelToKebabCase from "@core-ui/camelToKebabCase";
import React from "react";

export enum unSupportedElements {
	"tab" = "Tab",
	"openApi" = "OpenApi",
	"mermaid" = "Mermaid",
	"c4-diagram" = "C4-diagram",
	"ts-diagram" = "Ts-diagram",
	"db-diagram" = "Db-diagram",
	"plant-uml" = "PlantUml",
}

class HTMLComponents {
	private _publicApiUrlCreator: PublicApiUrlCreator;

	constructor(private _requestUrl: string, private _context: ParserContext) {
		this._publicApiUrlCreator = new PublicApiUrlCreator(
			encodeURIComponent(_context.getCatalog()?.getName()),
			encodeURIComponent(_context.getArticle()?.ref.path.value),
			_context.getBasePath().value,
		);
	}

	public getNullComponent(name: unSupportedElements) {
		return (props) => {
			const content = camelToKebabCase(name);
			return React.createElement(content, {
				...props,
				...(props.src && {
					src: this._getApiArticleResource(props.src),
				}),
			});
		};
	}

	public getTabs() {
		return (props) => {
			const { children } = props;
			return React.createElement("tabs", null, children);
		};
	}

	public getCode() {
		return ({ children }: { children: JSX.Element }) => {
			return <code>{children}</code>;
		};
	}

	public getLink() {
		return (props) => {
			const { children, href, isFile, resourcePath, hash } = props;
			const newHref = resourcePath
				? isFile
					? this._getApiArticleResource(resourcePath)
					: this._getArticleLink(resourcePath, hash)
				: href;
			return <a href={newHref}>{children}</a>;
		};
	}

	public getImg() {
		return (props) => {
			const src = this._getApiArticleResource(props.src);
			return this._getImage(src, props.title);
		};
	}

	public getDrawio() {
		return (props) => {
			const src = this._getApiArticleResource(props.src);
			return this._getImage(src, props.title);
		};
	}

	public getPlantUmlDiagram() {
		return (props) => {
			const { content, ...otherProps } = props;
			return this.getNullComponent(unSupportedElements["plant-uml"])({
				...otherProps,
				...(content && { children: content }),
			});
		};
	}

	private _getImage = (src: string, title?: string) => {
		return (
			<div>
				<img src={src} />
				{title && <em>{title}</em>}
			</div>
		);
	};

	private _getArticleLink(path: string, hash: string) {
		const modifiedLink = this._context.getLinkManager().getAbsolutePath(new Path(path));
		return this._getApiArticle(modifiedLink.toString(), hash);
	}

	private _getApiArticle(link: string, hash?: string) {
		const url = this._publicApiUrlCreator.getApiArticle(link, hash);
		return this._addRequestUrl(url.toString());
	}

	private _getApiArticleResource(src: string) {
		const url = this._publicApiUrlCreator.getApiArticleResource(src);
		return this._addRequestUrl(url.toString());
	}

	private _addRequestUrl = (src: string) => {
		return src.slice(0, 4) == "http" ? src : this._requestUrl + Path.empty.join(new Path(src)).value;
	};
}

export default HTMLComponents;
