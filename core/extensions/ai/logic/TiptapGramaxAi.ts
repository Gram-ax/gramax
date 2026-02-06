import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import Url from "@core-ui/ApiServices/Types/Url";
import { DOMSerializer, Fragment, Schema } from "@tiptap/pm/model";
import assert from "assert";

class TiptapGramaxAi {
	constructor(
		private readonly _apiUrlCreator: ApiUrlCreator,
		private readonly _schema: Schema,
	) {}

	public async prettify(fragment: Fragment, command: string): Promise<string> {
		assert(fragment.childCount > 0, "fragment must have at least one child");

		const html = this._fragmentToInnerHTML(fragment);
		const url = this._apiUrlCreator.getPrettifiedText(command);
		const text = await this._sendRequest(url, html);

		return text;
	}

	public async transcribe(buffer: ArrayBuffer): Promise<string> {
		const url = this._apiUrlCreator.transcribeAudio();
		const text = await this._sendRequest(url, new Blob([buffer], { type: "audio/webm" }));

		return text;
	}

	public async generate(command: string): Promise<string> {
		const url = this._apiUrlCreator.getGeneratedText(command);
		const text = await this._sendRequest(url, null);

		return text;
	}

	private async _sendRequest(url: Url, body: BodyInit): Promise<string> {
		const res = await FetchService.fetch(url, body);

		assert(res.ok, "Failed to send request");

		return await res.text();
	}

	private _clearFragment(fragment: Fragment): Fragment {
		const clearedNodes = [];

		fragment.forEach((node) => {
			if (node.childCount === 0 && node.isTextblock) return;

			clearedNodes.push(node);
		});

		return Fragment.from(clearedNodes);
	}

	private _fragmentToInnerHTML(fragment: Fragment): string {
		assert(fragment, "fragment is required");

		const clearedFragment = this._clearFragment(fragment);
		const serializer = DOMSerializer.fromSchema(this._schema);
		const html = serializer.serializeFragment(clearedFragment);

		const tempDiv = document.createElement("div");
		tempDiv.appendChild(html.cloneNode(true));

		const innerHTML = tempDiv.innerHTML;
		tempDiv.remove();

		return innerHTML;
	}
}

export default TiptapGramaxAi;
