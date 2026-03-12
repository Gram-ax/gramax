import type { ToSpan } from "@ext/loggers/opentelemetry";
import type { Buffer } from "buffer";

export default abstract class HashItem implements ToSpan {
	public abstract getKey(): string;
	public abstract getContent(): Promise<string>;
	public abstract getHashContent(): Promise<string>;
	public abstract getContentAsBinary(): Promise<Buffer>;

	toSpan(): unknown {
		return {
			key: this.getKey(),
		};
	}
}
