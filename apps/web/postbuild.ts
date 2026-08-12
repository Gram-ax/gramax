import fs from "fs";

const bundle = fs.readFileSync("./crates/gramax-wasm/dist/gramax-wasm.js", "utf-8");

const eventListener = `worker.addEventListener("message",(ev)=>{ev.data.type=="otel"&&self.send_otel(ev.data.spans);ev.data.type=="remote-progress"&&onRemoteProgress(ev.data.progress);ev.data.ptr&&self.on_done(ev.data.callbackId,ev.data.ptr);});`;

const minifiedTarget = `allocateUnusedWorker(){var worker;if(Module["mainScriptUrlOrBlob"]){var pthreadMainJs=Module["mainScriptUrlOrBlob"];if(typeof pthreadMainJs!="string"){pthreadMainJs=URL.createObjectURL(pthreadMainJs)}worker=new Worker(pthreadMainJs,{type:"module",name:"em-pthread"})}else worker=new Worker(new URL("gramax-wasm.js",import.meta.url),{type:"module",name:"em-pthread"});PThread.unusedWorkers.push(worker)}`;

const minifiedReplacement = `allocateUnusedWorker(){var worker;if(Module["mainScriptUrlOrBlob"]){var pthreadMainJs=Module["mainScriptUrlOrBlob"];if(typeof pthreadMainJs!="string"){pthreadMainJs=URL.createObjectURL(pthreadMainJs)}worker=new Worker(pthreadMainJs,{type:"module",name:"em-pthread"})}else{worker=new Worker(new URL("gramax-wasm.js",import.meta.url),{type:"module",name:"em-pthread"});}${eventListener}PThread.unusedWorkers.push(worker)}`;

const replaced = bundle.replace(minifiedTarget, minifiedReplacement);

if (replaced === bundle) throw "postbuild: replacement failed — Emscripten bundle format may have changed";

fs.writeFileSync("./crates/gramax-wasm/dist/gramax-wasm.js", replaced);
