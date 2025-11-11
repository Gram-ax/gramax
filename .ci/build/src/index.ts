#!/usr/bin/env bun

import { $ } from "bun";
import * as cmd from "./cmd";
import { project, setupEnvs, version } from "./util";

setupEnvs();

const parsed = Bun.argv[2];

if (parsed === "version") {
	await cmd.printVersion();
	process.exit(0);
}

console.log(`cwd: ${process.cwd()}`);
console.log(`project: ${project}`);
console.log(`version: ${version()}`);

try {
	switch (parsed) {
		case "build":
			await cmd.build();
			break;
		case "sign":
			await cmd.sign();
			break;
		case "sign-ci-windows":
			await cmd.signCiWindows();
			break;
		case "make-icons":
			await cmd.makeIcons();
			break;
		case "upload":
			await cmd.upload();
			break;
		default:
			parsed ? console.error(`failed: unknown command: ${parsed}`) : console.error("failed: no command provided");
			const msg = "available commands: build, sign, make-icons, upload, sign-ci-windows, version";
			console.error(msg);
			process.exit(1);
	}
} catch (error) {
	let err: Error = error as Error;

	if (error instanceof $.ShellError) {
		err = new Error(error.message);
		err.stack = error.stack;
		err.name = error.name;
	}

	throw err;
}
