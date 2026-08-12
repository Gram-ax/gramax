import { PropsAdapter } from "./propsAdapter";

const propsAdapter = new PropsAdapter();

function createContext(props: Record<string, unknown> = {}) {
	const ru = {};
	const catalog = { ctx: {}, deref: {} };
	const updateProps = jest.fn().mockResolvedValue(undefined);
	const setOrder = jest.fn().mockResolvedValue(undefined);
	const sortItems = jest.fn().mockResolvedValue(undefined);
	const context = {
		item: { props, logicPath: "docs/title", updateProps, setOrder, parent: { sortItems } },
		catalog,
		app: { resourceUpdaterFactory: { withContext: jest.fn().mockReturnValue(() => ru) } },
		ctx: {},
		commands: {},
	} as never;
	return { context, ru, catalog, updateProps, setOrder, sortItems };
}

describe("PropsAdapter", () => {
	test("expandToAgentView serializes public props as frontmatter", async () => {
		const { context } = createContext({ title: "Title" });
		const document = await propsAdapter.expandToAgentView("Body", context);
		expect(document).toBe("---\ntitle: Title\n---\nBody");
	});

	test("applyAgentViewToStorage returns body and updates props from frontmatter", async () => {
		const { context, ru, catalog, updateProps } = createContext({ title: "Title" });

		const body = await propsAdapter.applyAgentViewToStorage("---\ntitle: Title\n---\nLine 1\nLine 2", context);

		expect(body).toBe("Line 1\nLine 2");
		expect(updateProps).toHaveBeenCalledWith({ title: "Title", logicPath: "docs/title" }, ru, catalog.deref);
	});

	test("applyAgentViewToStorage preserves body whitespace", async () => {
		const { context } = createContext({ title: "Title" });
		const content = "\nLine 1\nLine 2\n";

		const agentView = await propsAdapter.expandToAgentView(content, context);
		const body = await propsAdapter.applyAgentViewToStorage(agentView, context);

		expect(body).toBe(content);
	});

	test("private props are omitted on expand and stripped on apply", async () => {
		const { context, updateProps } = createContext({
			title: "Title",
			fileName: "title.md",
			logicPath: "docs/title",
			shouldBeCreated: true,
			welcome: true,
		});
		const document = await propsAdapter.expandToAgentView("Body", context);

		const body = await propsAdapter.applyAgentViewToStorage(
			"---\ntitle: Title\nfileName: changed.md\nlogicPath: changed\n---\nBody",
			context,
		);

		expect(document).not.toContain("logicPath");
		expect(document).not.toContain("fileName");
		expect(document).not.toContain("shouldBeCreated");
		expect(document).not.toContain("welcome");
		expect(body).toBe("Body");
		expect(updateProps).toHaveBeenCalledWith(
			{ title: "Title", logicPath: "docs/title" },
			expect.anything(),
			expect.anything(),
		);
	});

	test("applyAgentViewToStorage updates order via setOrder", async () => {
		const { context, updateProps, setOrder, sortItems } = createContext({ title: "Title", order: 9 });

		const body = await propsAdapter.applyAgentViewToStorage("---\ntitle: Title\norder: 5\n---\nBody", context);

		expect(body).toBe("Body");
		expect(setOrder).toHaveBeenCalledWith(5);
		expect(sortItems).toHaveBeenCalledWith("no-sort");
		expect(updateProps).toHaveBeenCalledWith(
			{ title: "Title", logicPath: "docs/title" },
			expect.anything(),
			expect.anything(),
		);
	});

	test("expandToAgentView and applyAgentViewToStorage handle article properties", async () => {
		const properties = [{ id: "status", value: ["draft"] }];
		const { context, updateProps } = createContext({ title: "Title", properties });
		const document = await propsAdapter.expandToAgentView("Body", context);
		expect(document).toContain("properties:");

		const body = await propsAdapter.applyAgentViewToStorage(
			"---\ntitle: Title\nproperties:\n  - id: status\n    value:\n      - approved\n---\nBody",
			context,
		);

		expect(body).toBe("Body");
		expect(updateProps).toHaveBeenCalledWith(
			{
				title: "Title",
				properties: [{ id: "status", value: ["approved"] }],
				logicPath: "docs/title",
			},
			expect.anything(),
			expect.anything(),
		);
	});

	test("applyAgentViewToStorage rejects invalid frontmatter", async () => {
		const { context } = createContext();
		await expect(propsAdapter.applyAgentViewToStorage("---\n: invalid\n---\nbody", context)).rejects.toThrow();
	});
});
