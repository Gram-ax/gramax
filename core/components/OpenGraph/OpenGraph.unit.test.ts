import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OpenGraph from "./OpenGraph";

describe("OpenGraph", () => {
	test("uses an absolute image URL", () => {
		const html = renderToStaticMarkup(
			createElement(OpenGraph, {
				domain: "https://docs.example.com",
				openGraphData: {
					title: "Article",
					description: "Description",
					pathname: "/catalog/article",
				},
			}),
		);

		expect(html).toContain('content="https://docs.example.com/test-file-stub" property="og:image"');
	});
});
