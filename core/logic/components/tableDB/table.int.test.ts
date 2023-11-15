import getApplication from "@app/node/app";
import Path from "../../FileProvider/Path/Path";

describe("TableDB", () => {
	test("корректно выдает поля для таблицы", async () => {
		const app = await getApplication();
		const fp = app.lib.getFileProvider();

		const ref = {
			storageId: fp.storageId,
			path: new Path("data/testSchema.yaml"),
		};

		const result = await app.tablesManager.readSchema(ref);

		expect(result).toEqual([
			{
				title: { default: "Some contract title" },
				description: { default: "Some contact description" },
				fields: [
					{
						title: { default: "some id title" },
						sqlType: "some sqlType",
						code: "ID",
						nullable: true,
						description: { default: null },
					},
				],
				code: "Contract",
			},
		]);
	});
});
