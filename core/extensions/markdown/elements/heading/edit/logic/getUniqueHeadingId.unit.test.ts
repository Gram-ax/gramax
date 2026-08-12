import getUniqueHeadingId from "./getUniqueHeadingId";

describe("getUniqueHeadingId", () => {
	test("returns the first ID not used by another DOM element", () => {
		document.body.innerHTML = `
			<article>
				<h2 id="section">Section</h2>
				<h2 id="section-1">Section</h2>
				<h2 id="edited">Section</h2>
			</article>
		`;
		const editedHeading = document.getElementById("edited");

		expect(getUniqueHeadingId(editedHeading, "Section")).toBe("section-2");
	});

	test("allows the edited heading to keep its ID", () => {
		document.body.innerHTML = '<article><h2 id="section">Section</h2></article>';
		const editedHeading = document.getElementById("section");

		expect(getUniqueHeadingId(editedHeading, "Section")).toBe("section");
	});
});
