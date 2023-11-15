import { invoke } from "@tauri-apps/api/primitives";
import runTests from "../tauri/TauriFileProvider.unit.test";

runTests()
	.then(() => invoke("quit", { message: "Tests passed", code: 0 }))
	.catch(() => invoke("quit", { message: "Tests failed", code: -1 }));
