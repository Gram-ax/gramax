let call: typeof TauriCall | typeof WasmCall;
/// #if VITE_ENVIRONMENT == "browser"
// #v-ifdef VITE_ENVIRONMENT=browser
import { callFSWasm as WasmCall } from "./wasm";
call = WasmCall;
/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT=tauri
import { call as TauriCall } from "./tauri";
call = TauriCall;
// #v-endif
/// #endif
export default call;
