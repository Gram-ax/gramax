const EPSILON = 1e-10;
const MAX_PRECISION = 6;

export const digitsAfterDot = (num: number) => {
	if (isNaN(num)) return 0;

	let count = 0;
	while (num % 1 !== 0 && count < MAX_PRECISION) {
		num *= 10;
		count++;
	}
	return count;
};

const limit = (number: number, precision: number) => {
	if (isNaN(number)) return 0;
	const factor = Math.pow(10, Math.min(precision, MAX_PRECISION));
	return Math.round(number * factor) / factor;
};

const findOrderIndex = (orders: number[], target: number): number => {
	return orders.findIndex((o) => Math.abs(o - target) < EPSILON);
};

const findSimplestNumber = (start: number, end: number): number => {
	const diff = end - start;
	const middle = limit(start + diff / 2, MAX_PRECISION);

	const maxDigits = Math.max(digitsAfterDot(start), digitsAfterDot(end));
	const step = Math.pow(10, -maxDigits);

	const result = limit(Math.round(middle / step) * step, maxDigits);

	if (result <= start || result >= end) return middle;
	return result;
};

const rawOrderAfter = (orders: number[], order: number) => {
	if (!Array.isArray(orders) || orders.length === 0) return 1;
	if (isNaN(order) || order < 0) return limit(orders[0] / 2, 1) || 0.5;

	const currentIndex = findOrderIndex(orders, order);

	if (currentIndex === -1) {
		const insertIndex = orders.findIndex((o) => o > order);

		if (insertIndex === -1) return limit(orders[orders.length - 1] + 1, 1);
		if (insertIndex === 0) return limit(orders[0] / 2, 1);

		const prev = orders[insertIndex - 1];
		const next = orders[insertIndex];

		return findSimplestNumber(prev, next);
	}

	if (currentIndex === orders.length - 1) return limit(order + 1, 1);

	const current = orders[currentIndex];
	const next = orders[currentIndex + 1];

	return findSimplestNumber(current, next);
};

const rawOrderTryRound = (orders: number[], order: number) => {
	if (isNaN(order)) return 1;

	const digits = Math.min(digitsAfterDot(order), MAX_PRECISION);

	if (digits <= 1) return order;

	const diff = 10 ** (-1 * digits);
	const ceil = limit(order + diff, digits);

	if (!orders.some((o) => Math.abs(o - ceil) < EPSILON)) {
		return limit(ceil, digits);
	}

	return limit(order, digits);
};

export const roundedOrderAfter = (orders: number[], order: number) => {
	if (!Array.isArray(orders)) return 1;
	const validOrders = orders.filter((o) => !isNaN(o) && isFinite(o));
	const rawOrder = rawOrderAfter(validOrders, order);
	return rawOrderTryRound(validOrders, rawOrder);
};
