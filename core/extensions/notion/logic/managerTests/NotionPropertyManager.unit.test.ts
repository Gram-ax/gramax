import { NotionPropertyManager } from "@ext/notion/logic/NotionPropertyManager";
import * as data from "./addCatalogPropertiesData.json";

describe("NotionPropertyManager - addCatalogProperties", () => {
	let manager: NotionPropertyManager;

	beforeEach(() => {
		const pageTree = data.input;
		manager = new NotionPropertyManager(pageTree as any);
	});

	it("should correctly process Notion database properties", () => {
		const result = manager.properties.map((property) => ({
			name: property.name,
			type: property.type,
			values: property.values ?? property.values,
		}));

		expect(result).toEqual(data.expected);
	});
});
