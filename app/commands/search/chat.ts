import { ChatResponse } from "@ics/gx-vector-search/dist/apiClient/requestTypes/chat";
import { Command } from "../../types/Command";
import { VectorDbApiClient } from "@ics/gx-vector-search";
import { ResponseKind } from "@app/types/ResponseKind";

const chat: Command<{ query: string, catalogName?: string }, ChatResponse | undefined> = Command.create({
	path: "search/chat",
	
	kind: ResponseKind.json,

	async do({ query, catalogName }) {
		if (!this._app.conf.search.vector.enabled) {
			return;
		}

		const api = new VectorDbApiClient({
			baseUrl: this._app.conf.search.vector.apiUrl,
			collectionName: this._app.conf.search.vector.collectionName,
		});

		return await api.chat(query, catalogName);
	},

	params(_, q) {
		return { query: q.query, catalogName: q.catalogName };
	},
});

export default chat;
