import { Buffer } from "buffer";

export default abstract class HashItem {
	public abstract getKey(): string;
	public abstract getContent(): Promise<string>;
	public abstract getHashContent(): Promise<string>;
	public abstract getContentAsBinary(): Promise<Buffer>;
}
