import Cors from "cors";
import type ApiRequest from "../../logic/Api/ApiRequest";
import type ApiResponse from "../../logic/Api/ApiResponse";

// Initializing the cors middleware
const cors = Cors({
	origin: true,
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
export function applyCors(req: ApiRequest, res: ApiResponse) {
	return new Promise((resolve, reject) => {
		cors(req as any, res as any, (result: any) => {
			if (result instanceof Error) {
				return reject(result);
			}

			return resolve(result);
		});
	});
}
