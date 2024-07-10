export const digitsAfterDot = (num: number) => {
	if (isNaN(num)) return 0;

	let count = 0;
	while (num % 1 !== 0) {
		num *= 10;
		count++;
	}
	return count;
};

const lastDigit = (num: number) => {
	const count = digitsAfterDot(num);
	return (num * 10 ** count) % 10;
};

const limit = (number: number, precision: number) => {
	const factor = Math.pow(10, precision);
	return Math.round(number * factor) / factor;
};

const rawOrderAfter = (orders: number[], order: number) => {
	if (isNaN(order) || order == 0) return (orders.at(0) ?? 1) / 2;

	const prev = orders.findIndex((o) => o == order);
	if (prev == -1) return orders.at(-1) ?? order + 1;
	if (prev == orders.length - 1) return order + 1;
	return (orders[prev] + orders[prev + 1]) / 2;
};

const rawOrderTryRound = (orders: number[], order: number) => {
	const EPSILON = 10 ** -10;
	const last = lastDigit(order) / 10;
	const digits = digitsAfterDot(order);

	if (digits == 1 || digits == 0) {
		const floor = Math.floor(order);
		if (floor > 0 && orders.findIndex((o) => o == floor) < 0) return floor;

		const ceil = Math.ceil(order);
		if (orders.findIndex((o) => o == ceil) < 0) return ceil;

		return order;
	}

	const diff = 10 ** (-1 * digits) * (Math.floor(last) === 1 ? -1 : 1) * (last * 10);
	const idx = orders.findIndex((o) => o == order);
	const floor = limit(order - diff, 10);
	const freeFloor =
		floor > 0 && orders[idx - 1] > floor && orders.findIndex((o) => Math.abs(o - floor) < EPSILON) < 0;
	const ceil = limit(order + diff, 10);
	const freeCeil = ceil - 1 < Math.trunc(order) && orders.findIndex((o) => Math.abs(o - ceil) < EPSILON) < 0;

	if (freeFloor) return floor;
	if (freeCeil) return ceil;

	return order;
};

export const roundedOrderAfter = (orders: number[], order: number) => {
	const rawOrder = rawOrderAfter(orders, order);
	return rawOrderTryRound(orders, rawOrder);
};
