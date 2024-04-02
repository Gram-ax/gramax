import Path from "@core/FileProvider/Path/Path";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import itemRefConverter from "@core/Plugin/logic/utils/itemRefConverter";

describe("itemRefConverter конвертирует", () => {
	it("itemRef в id", () => {
		const itemRef: ItemRef = { path: new Path("path"), storageId: "storageId" };
		expect(itemRefConverter.toId(itemRef)).toEqual(JSON.stringify({ path: "path", storageId: "storageId" }));
	});
	it("id в itemRef", () => {
		const itemRef: ItemRef = { path: new Path("path"), storageId: "storageId" };
		expect(itemRefConverter.toItemRef(JSON.stringify({ path: "path", storageId: "storageId" }))).toEqual(itemRef);
	});
});
