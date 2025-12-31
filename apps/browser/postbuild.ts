import fs from "fs";

const bundle = fs.readFileSync("./crates/gramax-wasm/dist/gramax-wasm.js", "utf-8");

let replaced = bundle.replace(
	`allocateUnusedWorker(){var worker;if(Module["mainScriptUrlOrBlob"]){var pthreadMainJs=Module["mainScriptUrlOrBlob"];if(typeof pthreadMainJs!="string"){pthreadMainJs=URL.createObjectURL(pthreadMainJs)}worker=new Worker(pthreadMainJs,{type:"module",workerData:"em-pthread",trackUnmanagedFds:false,name:"em-pthread"})}else worker=new Worker(new URL("gramax-wasm.js",import.meta.url),{type:"module",workerData:"em-pthread",trackUnmanagedFds:false,name:"em-pthread"});PThread.unusedWorkers.push(worker)}`,
	`allocateUnusedWorker(){var worker;if(Module["mainScriptUrlOrBlob"]){var pthreadMainJs=Module["mainScriptUrlOrBlob"];if(typeof pthreadMainJs!="string"){pthreadMainJs=URL.createObjectURL(pthreadMainJs)}worker=new Worker(pthreadMainJs,{type:"module",workerData:"em-pthread",trackUnmanagedFds:false,name:"em-pthread"})}else{worker=new Worker(new URL("gramax-wasm.js",import.meta.url),{type:"module",workerData:"em-pthread",trackUnmanagedFds:false,name:"em-pthread"});} worker.addEventListener("message", (ev) => {
		      ev.data.type == "remote-progress" && onRemoteProgress(ev.data.progress);
		      ev.data.ptr && self.on_done(ev.data.callbackId, ev.data.ptr);
		  });
  PThread.unusedWorkers.push(worker)}`,
);

replaced = replaced.replace(
	`allocateUnusedWorker() {
    var worker;
    // If we're using module output, use bundler-friendly pattern.
    if (Module["mainScriptUrlOrBlob"]) {
      var pthreadMainJs = Module["mainScriptUrlOrBlob"];
      if (typeof pthreadMainJs != "string") {
        pthreadMainJs = URL.createObjectURL(pthreadMainJs);
      }
      worker = new Worker(pthreadMainJs, {
        "type": "module",
        // This is the way that we signal to the node worker that it is hosting
        // a pthread.
        "workerData": "em-pthread",
        // In WasmFS, close() is not proxied to the main thread. Suppress
        // warnings when a thread closes a file descriptor it didn't open.
        // See: https://github.com/emscripten-core/emscripten/issues/24731
        "trackUnmanagedFds": false,
        // This is the way that we signal to the Web Worker that it is hosting
        // a pthread.
        "name": "em-pthread"
      });
    } else // We need to generate the URL with import.meta.url as the base URL of the JS file
    // instead of just using new URL(import.meta.url) because bundler's only recognize
    // the first case in their bundling step. The latter ends up producing an invalid
    // URL to import from the server (e.g., for webpack the file:// path).
    // See https://github.com/webpack/webpack/issues/12638
    worker = new Worker(new URL("gramax-wasm.js", import.meta.url), {
      "type": "module",
      // This is the way that we signal to the node worker that it is hosting
      // a pthread.
      "workerData": "em-pthread",
      // In WasmFS, close() is not proxied to the main thread. Suppress
      // warnings when a thread closes a file descriptor it didn't open.
      // See: https://github.com/emscripten-core/emscripten/issues/24731
      "trackUnmanagedFds": false,
      // This is the way that we signal to the Web Worker that it is hosting
      // a pthread.
      "name": "em-pthread"
    });
    PThread.unusedWorkers.push(worker);
  }`,
	`allocateUnusedWorker() {
			var worker;
			// If we're using module output, use bundler-friendly pattern.
			if (Module["mainScriptUrlOrBlob"]) {
				var pthreadMainJs = Module["mainScriptUrlOrBlob"];
				if (typeof pthreadMainJs != "string") {
					pthreadMainJs = URL.createObjectURL(pthreadMainJs);
				}
				worker = new Worker(pthreadMainJs, {
					type: "module",
					// This is the way that we signal to the node worker that it is hosting
					// a pthread.
					workerData: "em-pthread",
					// In WasmFS, close() is not proxied to the main thread. Suppress
					// warnings when a thread closes a file descriptor it didn't open.
					// See: https://github.com/emscripten-core/emscripten/issues/24731
					trackUnmanagedFds: false,
					// This is the way that we signal to the Web Worker that it is hosting
					// a pthread.
					name: "em-pthread",
				});
			} // We need to generate the URL with import.meta.url as the base URL of the JS file
			// instead of just using new URL(import.meta.url) because bundler's only recognize
			// the first case in their bundling step. The latter ends up producing an invalid
			// URL to import from the server (e.g., for webpack the file:// path).
			// See https://github.com/webpack/webpack/issues/12638
			else
				worker = new Worker(new URL("gramax-wasm.js", import.meta.url), {
					type: "module",
					// This is the way that we signal to the node worker that it is hosting
					// a pthread.
					workerData: "em-pthread",
					// In WasmFS, close() is not proxied to the main thread. Suppress
					// warnings when a thread closes a file descriptor it didn't open.
					// See: https://github.com/emscripten-core/emscripten/issues/24731
					trackUnmanagedFds: false,
					// This is the way that we signal to the Web Worker that it is hosting
					// a pthread.
					name: "em-pthread",
				});

			worker.addEventListener("message", (ev) => {
				ev.data.type == "remote-progress" && onRemoteProgress(ev.data.progress);
				ev.data.ptr && self.on_done(ev.data.callbackId, ev.data.ptr);
			});

			PThread.unusedWorkers.push(worker);
		}`,
);

fs.writeFileSync("./crates/gramax-wasm/dist/gramax-wasm.js", replaced);
