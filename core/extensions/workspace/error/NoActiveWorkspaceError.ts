import DefaultError from "@ext/errorHandlers/logic/DefaultError";

export default class NoActiveWorkspace extends DefaultError {
	constructor() {
		super("No active workspace");
	}
}
