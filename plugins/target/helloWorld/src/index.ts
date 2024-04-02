import { Plugin } from "@core/Plugin";
import stringSimilarity from "string-similarity";

class HelloWorldPlugin extends Plugin {
	get name() {
		return "helloWorld";
	}
	onLoad(): void | Promise<void> {
		console.log("loaded");
		this.addCommand({
			name: "index",
			do() {
				const similarity = stringSimilarity.compareTwoStrings("abc", "abd");
				console.log(similarity);
				console.log("Hello World!");
			},
		});
		this.addCommand<{ key: string }, string>({
			name: "get",
			async do({ key }: { key: string }) {
				return this.app.storage.get(key);
			},
		});
		this.addCommand<{ key: string; value: string }, void>({
			name: "set",
			async do({ key, value }: { key: string; value: string }) {
				await this.app.storage.set(key, value);
			},
		});
	}
	onUnload() {
		console.log("unloded");
	}
}

export default HelloWorldPlugin;
