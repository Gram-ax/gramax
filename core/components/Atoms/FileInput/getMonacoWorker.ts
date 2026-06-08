import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";

const workerByLabel = {
	css: CssWorker,
	html: HtmlWorker,
	xml: HtmlWorker,
};

const getMonacoWorker = (_: string, label: string) => {
	const Worker = workerByLabel[label] ?? EditorWorker;
	return new Worker();
};

export default getMonacoWorker;
