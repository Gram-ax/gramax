import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";

export const InvalidSourceDataErrorCode = "invalid-source-data";

export class InvalidSourceData extends DefaultError {
	constructor(sourceName: string, cause?: Error) {
		super(
			"Invalid source data message",
			cause,
			{
				errorCode: InvalidSourceDataErrorCode,
				sourceName,
			},
			false,
			"Invalid source data",
		);
	}

	get type() {
		return ErrorType.NetworkApi;
	}
}
