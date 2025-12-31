export const getColorList = () => [
	"hsl(var(--peony))",
	"hsl(var(--garnet))",
	"hsl(var(--cinnamon))",
	"hsl(var(--caramel))",
	"hsl(var(--hazel))",
	"hsl(var(--honey))",
	"hsl(var(--lemon))",
	"hsl(var(--olive))",
	"hsl(var(--sage))",
	"hsl(var(--mint))",
	"hsl(var(--bazil))",
	"hsl(var(--spruce))",
	"hsl(var(--aqua))",
	"hsl(var(--azure))",
	"hsl(var(--tiffany))",
	"hsl(var(--marine))",
	"hsl(var(--turquoise))",
	"hsl(var(--frost))",
	"hsl(var(--bosphorus))",
	"hsl(var(--lavender))",
	"hsl(var(--orchid))",
	"hsl(var(--lilac))",
	"hsl(var(--plume))",
	"hsl(var(--velvet))",
];

const savedIds: Map<string, string> = new Map();

export const getUniqueColor = (uniqueId: string) => {
	if (savedIds.has(uniqueId)) return savedIds.get(uniqueId);

	const colorList = getColorList();

	let hash = 5381;
	for (let i = 0; i < uniqueId.length; i++) {
		hash = (hash * 33) ^ uniqueId.charCodeAt(i);
	}

	const index = Math.abs(hash) % colorList.length;
	const color = colorList[index];

	savedIds.set(uniqueId, color);

	return color;
};
