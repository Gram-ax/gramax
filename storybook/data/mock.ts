import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { HttpResponse, delay, http } from "msw";

export type MockedAPIEndpoint = {
	path: string;
	response?: any;
	delay?: number;
	mimeType?: MimeTypes;
	errorMessage?: string;
	errorProps?: { [key: string]: any } & { errorCode?: string };
};

const mock = (data: MockedAPIEndpoint[]) => {
	const resolver = ({
		response,
		delay: delayMs,
		mimeType = MimeTypes.json,
		errorMessage,
		errorProps,
	}: MockedAPIEndpoint) => {
		return async () => {
			await delay(delayMs);
			const mockedResponse =
				mimeType === MimeTypes.json
					? HttpResponse.json(response, { headers: { "Content-Type": mimeType }, status: 200 })
					: HttpResponse.text(response as string, { headers: { "Content-Type": mimeType }, status: 200 });

			return errorMessage || errorProps
				? HttpResponse.json(
						{ message: errorMessage, stack: "stack", props: { ...errorProps } },
						{ status: 500 },
				  )
				: mockedResponse;
		};
	};
	return [...data.map((d) => http.get(d.path, resolver(d))), ...data.map((d) => http.post(d.path, resolver(d)))];
};

export default mock;
