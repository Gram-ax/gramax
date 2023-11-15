const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { exec, spawn } = require("child_process");
const killPort = require("kill-port");
const PORT = 5173;

async function stopLocalServer(code_exit) {
	await killPort(PORT, "tcp").then(() => {
		console.log(`Vite server on port ${PORT} has been stopped.`);
	});
	process.exit(code_exit);
}

function startTest(argv) {
	const headlessArg = argv.headless ? "HEADLESS=true" : "HEADLESS=false";
	const command = `cd ./e2e/runner/ && cross-env PWDEBUG=0 IS_LOCAL=true ${headlessArg} npm run test-ci`;

	const tests = exec(command, (error, stderr) => {
		if (error) console.error(`Ошибка выполнения тестов: ${error.message}`);
		if (stderr) console.error(stderr);
	});

	tests.stdout.on("data", (buffer) => {
		console.log(buffer.toString());
	});

	tests.on("exit", async (code) => {
		await stopLocalServer(code);
	});

	tests.on("error", async (err) => {
		console.log("ERROR", err);
		await stopLocalServer(1);
	});

	return tests;
}

function startViteServer(argv) {
	const viteServer = spawn("cd ./target/browser && npm run dev", {
		stdio: "pipe",
		shell: true
	});

	viteServer.stdout.on("data", (buffer) => {
		const data = buffer.toString();
		console.log(data);

		if (data.includes("http://localhost:")) startTest(argv);
	});

	viteServer.on("error", async (err) => {
		console.error("ERROR", err);
		await stopLocalServer(1);
	});
}

yargs(hideBin(process.argv))
	.command(
		"local [headless]",
		"Запускает локальные e2e тесты",
		(yargs) => {
			yargs.positional("headless", {
				alias: "h",
				type: "boolean",
				default: false,
				description: "Запустить в режиме headless"
			});
		},
		(argv) => startViteServer(argv)
	)
	.help().argv;
