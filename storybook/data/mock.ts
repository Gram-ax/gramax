import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { DefaultBodyType, PathParams, ResponseComposition, RestContext, RestRequest, rest } from "msw";

export type MockedAPIEndpoint = {
	path: string;
	response?: any;
	delay?: number;
	mimeType?: MimeTypes;
	errorMessage?: string;
	errorProps?: { [key: string]: any } & { errorCode?: string };
};

const mock = (data: MockedAPIEndpoint[]) => {
	const resolver = ({ response, delay, mimeType = MimeTypes.json, errorMessage, errorProps }: MockedAPIEndpoint) => {
		return (
			_req: RestRequest<never, PathParams<string>>,
			res: ResponseComposition<DefaultBodyType>,
			ctx: RestContext,
		) => {
			const mockedResponse = mimeType === MimeTypes.json ? ctx.json(response) : ctx.body(response as string);
			return errorMessage || errorProps
				? res(
						ctx.delay(delay),
						ctx.status(500),
						ctx.json({ message: errorMessage, stack: "stack", props: { ...errorProps } }),
				  )
				: res(ctx.delay(delay), mockedResponse, ctx.set("Content-Type", mimeType));
		};
	};
	return [...data.map((d) => rest.get(d.path, resolver(d))), ...data.map((d) => rest.post(d.path, resolver(d)))];
};

export default mock;
