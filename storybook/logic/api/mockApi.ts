import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { DefaultBodyType, PathParams, ResponseComposition, RestContext, RestRequest, rest } from "msw";
import ApiData from "./model/ApiData";

const mockApi = (data: ApiData[]) => {
	const resolver = ({ response, delay, mimeType = MimeTypes.json, errorMessage, errorProps }: ApiData) => {
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

export default mockApi;
