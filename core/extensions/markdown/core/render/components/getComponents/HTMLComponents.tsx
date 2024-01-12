import Path from "../../../../../../logic/FileProvider/Path/Path";
import DiagramType from "../../../../../../logic/components/Diagram/DiagramType";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import ParserContext from "../../../Parser/ParserContext/ParserContext";

class HTMLComponents {
	private _apiUrlCreator: ApiUrlCreator;
	constructor(private _requestUrl: string, context: ParserContext) {
		this._apiUrlCreator = new ApiUrlCreator(
			context.getBasePath().value,
			context.getLanguage(),
			null,
			context.getIsLogged(),
			context.getCatalog()?.getName(),
			context.getArticle()?.ref.path.value,
		);
	}

	public getNull() {
		return this._getNull;
	}

	public getCode() {
		return this._getCode;
	}

	public getImg() {
		return (props) => {
			const src = this._apiUrlCreator.getArticleResource(props.src).toString();
			return this._getImage(src, this._requestUrl, { width: "50%" });
		};
	}

	public getDrawio() {
		return (props) => {
			const src = this._apiUrlCreator.getArticleResource(props.src).toString();
			return this._getImage(src, this._requestUrl);
		};
	}

	public getDiagramdb() {
		return (props) => {
			const src = this._apiUrlCreator.getDbDiagramUrl(props.path, props.primary, props.tags, "true").toString();
			return this._getImage(src, this._requestUrl);
		};
	}

	public getDiagramRendererImage(diagramName: DiagramType) {
		if (diagramName == DiagramType["c4-diagram"])
			return (props) => {
				const src = props.content
					? this._apiUrlCreator.getDiagramByContentUrl(diagramName, 0).toString()
					: this._apiUrlCreator.getDiagram(props.src, diagramName, 0).toString();
				return this._getImage(src, this._requestUrl);
			};
		return (props) => {
			const src = props.content
				? this._apiUrlCreator.getDiagramByContentUrl(diagramName).toString()
				: this._apiUrlCreator.getDiagram(props.src, diagramName).toString();
			return this._getImage(src, this._requestUrl);
		};
	}

	private _getNull = () => {
		return <></>;
	};

	private _getCode = ({ children }: { children: JSX.Element }) => {
		return <code>{children}</code>;
	};

	private _getImage = (url: string, requestUrl: string, props?: React.ImgHTMLAttributes<HTMLImageElement>) => {
		return (
			<>
				<br />
				<img src={this._addRequestUrl(url, requestUrl)} {...props} />
				<br />
			</>
		);
	};

	private _addRequestUrl = (src: string, ApiRequestUrl: string) => {
		return src.slice(0, 4) == "http" ? src : ApiRequestUrl + Path.empty.join(new Path(src)).value;
	};
}

export default HTMLComponents;
