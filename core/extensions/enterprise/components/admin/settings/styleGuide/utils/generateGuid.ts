export function generateGuid(): string {
	const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	return `${S4()}${S4()}-4${S4().substring(0, 3)}-${S4()}-${S4()}${S4()}${S4()}`.toLowerCase();
}
