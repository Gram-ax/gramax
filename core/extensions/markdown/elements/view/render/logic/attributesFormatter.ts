export default class AttributeFormatter {
	public parse(attrs: Record<string, string>) {
		return this._parse(attrs);
	}

	public stringify(attrs: Record<string, any>) {
		return this._stringify(attrs);
	}

	private _parse(attrs: Record<string, string>) {
		return Object.entries(attrs).reduce((result, [key, value]) => {
			if (!value) return result;

			switch (key) {
				case "defs":
					result[key] = value.split(",").map((def) => {
						const [defKey, defValue] = def.split("=");
						return {
							name: defKey.trim(),
							value: defValue
								? defValue
										.trim()
										.split("&")
										.map((v) => v.trim())
								: undefined,
						};
					});
					break;
				case "orderby":
				case "groupby":
				case "select":
					result[key] = value ? value.split(",").map((item) => item.trim()) : [];
					break;
				default:
					result[key] = value;
			}
			return result;
		}, {} as Record<string, any>);
	}

	private _stringify(attrs: Record<string, any>): { [key: string]: string } {
		const defs =
			typeof attrs.defs === "object"
				? attrs.defs.map((item: { name: string; value?: string[] }) => {
						return item.value === undefined ? item.name : `${item.name}=${item.value.join("&")}`;
				  })
				: [];

		const defsString = defs.join(",");

		const orderBy = attrs?.orderby;
		const orderByString = Array.isArray(orderBy) ? orderBy.join(",") : orderBy || "";

		const groupBy = attrs?.groupby;
		const groupByString = Array.isArray(groupBy) ? groupBy.join(",") : groupBy || "";

		const select = attrs?.select;
		const selectString = Array.isArray(select) ? select.join(",") : select || "";

		return { ...attrs, defs: defsString, orderby: orderByString, groupby: groupByString, select: selectString };
	}
}
