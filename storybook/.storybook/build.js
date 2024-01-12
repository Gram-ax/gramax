const fs = require("fs");
const { join, resolve } = require("path");

const base = resolve(__dirname, "../storybook-static");

const processFile = (filepath) => {
	const path = join(base, filepath);
	const content = fs.readFileSync(path).toString();
	fs.writeFileSync(path, content.replaceAll('href="./', 'href="').replaceAll('src="/', 'src="'));
};

processFile("index.html");
