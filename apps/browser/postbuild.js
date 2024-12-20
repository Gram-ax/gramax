import fs from "fs";

const bundle = fs.readFileSync("./wasm/dist/gramax-wasm.js", "utf-8");

let replaced = bundle.replace(
	"workerOptions)",
	`{type:"module",workerData:"em-pthread",name:"em-pthread"}); worker.addEventListener("message", (ev) => {
      ev.data.type == "clone-progress" && onCloneProgress(ev.data.progress);
      ev.data.ptr && self.on_done(ev.data.callbackId, ev.data.ptr);
  });`,
);

fs.writeFileSync("./wasm/dist/gramax-wasm.js", replaced);
