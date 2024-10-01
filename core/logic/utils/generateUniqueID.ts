export default (count: number = 5) => {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let randomKey = "";
	for (let i = 0; i < count; i++) {
		randomKey += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return randomKey;
};
