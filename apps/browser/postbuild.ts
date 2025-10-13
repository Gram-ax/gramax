import fs from "fs";

const bundle = fs.readFileSync("./crates/gramax-wasm/dist/gramax-wasm.js", "utf-8");

let replaced = bundle.replace(
	`{type:"module",workerData:"em-pthread",name:"em-pthread"});`,
	`{type:"module",workerData:"em-pthread",name:"em-pthread"}); worker.addEventListener("message", (ev) => {
      ev.data.type == "remote-progress" && onRemoteProgress(ev.data.progress);
      ev.data.ptr && self.on_done(ev.data.callbackId, ev.data.ptr);
  });`,
);

fs.writeFileSync("./crates/gramax-wasm/dist/gramax-wasm.js", replaced);
