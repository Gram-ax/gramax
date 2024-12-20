let call: typeof NextCall | typeof TauriCall | typeof WasmCall;
/// #if VITE_ENVIRONMENT == "browser"
// #v-ifdef VITE_ENVIRONMENT='browser'
import { callGitWasm as WasmCall } from "./wasm";
call = WasmCall;
/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT='next'
import { call as NextCall } from "./next";
call = NextCall;
// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT='tauri'
import { call as TauriCall } from "./tauri";
call = TauriCall;
// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "jest"
// #v-ifdef VITE_ENVIRONMENT='jest'
import { call as JestCall } from "./next";
call = JestCall;
// #v-endif
/// #endif

export default call;
