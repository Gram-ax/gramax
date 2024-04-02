import FetchService from "@core-ui/ApiServices/FetchService";
import Url from "@core-ui/ApiServices/Types/Url";
import { Buffer } from "buffer";
import { useEffect, useState } from "react";

const kinds = {
	"/": "image/jpg",
	i: "image/png",
	R: "image/gif",
	P: "image/svg+xml",
};

const resolveImageKind = (data: string): string => kinds[data[0]] ?? "image";

const useBase64Image = (url: Url) => {
	const [data, setData] = useState<string>();

	useEffect(() => {
		const loadImage = async () => {
			const res = await FetchService.fetch(url);
			if (!res?.body) return;
			const base64 = Buffer.from(res.body as any).toString("base64");
			setData(`data:${resolveImageKind(base64)};base64,${base64}`);
		};
		void loadImage();
	}, [url.toString()]);

	return data;
};

export default useBase64Image;
