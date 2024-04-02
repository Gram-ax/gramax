import { env } from "@app/resolveModule/env";
import { ConfigurationOptions } from "typesense/lib/Typesense/Configuration";

// const logger = {
// 	trace: (v) => console.log(v),
// 	debug: (v) => console.log(v),
// 	info: (v) => console.info(v),
// 	warn: (v) => console.warn(v),
// 	error: (v) => console.error(v),
// 	log: (v) => console.log(v),
// 	setLevel: () => {},
// };

export default class TypesenseConfig {
	private configurationOptions: ConfigurationOptions;

	constructor() {
		const host = env("TUPESENSE_HOST") ?? "";
		const port = +env("TUPESENSE_PORT") ?? 0;
		const protocol = env("TUPESENSE_PROTOCOL") ?? "";
		const apiKey = env("TUPESENSE_API_KEY") ?? "";
		this.configurationOptions = { nodes: [{ host, port, protocol }], apiKey };
	}

	getConfig(): {
		collectionName: string;
		config: ConfigurationOptions;
	} {
		return {
			collectionName: env("TUPESENSE_COLLECTION_NAME") ?? "",
			config: this.configurationOptions,
		};
	}
}
