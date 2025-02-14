import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { HttpResponse, delay, http } from "msw";

type ResponseType = boolean | number | string | symbol | null | undefined | object;

export type MockedAPIEndpoint = {
	path: string;
	response?: ResponseType | ((query: URLSearchParams, body: any) => Promise<ResponseType> | ResponseType);
	delay?: number;
	mimeType?: MimeTypes;
	errorMessage?: string;
	errorProps?: { [key: string]: any } & { errorCode?: string };
};

const mock = (data: MockedAPIEndpoint[]) => {
	const resolver = (
		{ response, delay: delayMs, mimeType = MimeTypes.json, errorMessage, errorProps }: MockedAPIEndpoint,
		request: Request,
	) => {
		return async () => {
			const res =
				typeof response === "function"
					? await response(new URLSearchParams(request.url), request.body ? await request.json() : null)
					: response;

			await delay(delayMs);
			const mockedResponse =
				mimeType === MimeTypes.json
					? HttpResponse.json(res, { headers: { "Content-Type": mimeType }, status: 200 })
					: HttpResponse.text(res as string, { headers: { "Content-Type": mimeType }, status: 200 });

			return errorMessage || errorProps
				? HttpResponse.json(
						{ message: errorMessage, stack: "stack", props: { ...errorProps } },
						{ status: 500 },
				  )
				: mockedResponse;
		};
	};
	return [
		...data.map((d) =>
			http.get(d.path, async (info) => {
				return resolver(d, info.request)();
			}),
		),
		...data.map((d) =>
			http.post(d.path, async (info) => {
				return resolver(d, info.request)();
			}),
		),
	];
};

export default mock;
