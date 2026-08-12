/** biome-ignore-all lint/style/useNamingConvention: for testing only */
import Path from "@core/FileProvider/Path/Path";
import type ResourceManager from "@core/Resource/ResourceManager";
import "@core/utils/asyncUtils";
import getAllRefs from "../getAllRefs";

describe("getAllRefs", () => {
	test("returns unique parsed ref files", async () => {
		const files: Record<string, string> = {
			"docs/schemas/pet.yaml": `
Pet:
  $ref: "./common.yaml#/Common"
PetDuplicate:
  $ref: "./common.yaml#/Common"
`,
			"docs/schemas/common.yaml": `
Common:
  type: string
`,
		};

		const rm = {
			set: jest.fn(),
			getContent: jest.fn(async (path: Path) => Buffer.from(files[path.value])),
			getAbsolutePath: (path: Path) => path.value,
		} as unknown as ResourceManager;

		const refsData = await getAllRefs(new Path("docs/openapi.yaml"), rm, {
			components: {
				schemas: {
					Pet: { $ref: "schemas/pet.yaml#/Pet" },
					PetDuplicate: { $ref: "schemas/pet.yaml#/PetDuplicate" },
				},
			},
		});

		expect(refsData).toEqual({
			refs: ["docs/schemas/pet.yaml", "docs/schemas/common.yaml"],
			files: {
				"docs/schemas/pet.yaml": {
					Pet: { $ref: "./common.yaml#/Common" },
					PetDuplicate: { $ref: "./common.yaml#/Common" },
				},
				"docs/schemas/common.yaml": {
					Common: { type: "string" },
				},
			},
		});
		expect(rm.getContent).toHaveBeenCalledTimes(2);
	});
});
