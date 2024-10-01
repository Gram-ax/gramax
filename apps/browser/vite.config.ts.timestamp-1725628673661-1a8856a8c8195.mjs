// vite.config.ts
import react from "file:///C:/Projects/doc-reader/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { mergeConfig } from "file:///C:/Projects/doc-reader/node_modules/vite/dist/node/index.js";
import mkcert from "file:///C:/Projects/doc-reader/node_modules/vite-plugin-mkcert/dist/mkcert.mjs";

// ../../scripts/compileTimeEnv.mjs
import child_process from "child_process";
var { execSync } = child_process;
var env = {
  GRAMAX_VERSION: null,
  BUILD_VERSION: null,
  BUGSNAG_API_KEY: null,
  PRODUCTION: null,
  SERVER_APP: null,
  SSO_SERVICE_URL: null,
  SSO_SERVICE_ENCRYPTION_KEY: null,
  BUGSNAG_CLIENT_KEY: null,
  BRANCH: null,
  COOKIE_SECRET: null,
  SHARE_ACCESS_TOKEN: null,
  AUTH_SERVICE_URL: null,
  DIAGRAM_RENDERER_SERVICE_URL: null,
  REVIEW_SERVICE_URL: null,
  CORS_PROXY_SERVICE_URL: null,
  GLS_URL: null
};
if (!process.env.COOKIE_SECRET) console.warn("WARNING: You need to set COOKIE_SECRET if you run gramax in production.");
var getBuiltInVariables = () => Object.keys(env).reduce((obj, x) => ({ ...obj, [x]: process.env[x] ?? env[x] }), {});
var getVersionData = () => {
  const commitCount = execSync('git rev-list --count --date=local --after="$(date +"%Y-%m-01T00:00:00")" HEAD', {
    shell: "bash"
  });
  const currentDate = execSync("date +%Y.%-m.%-d", { shell: "bash" });
  return { commitCount, currentDate };
};
var setVersion = (platform) => {
  const { commitCount, currentDate } = getVersionData();
  process.env.GRAMAX_VERSION = `${currentDate}-${platform}.${commitCount}`.replaceAll("\n", "");
};
var setBuildVersion = (platform) => {
  const { commitCount, currentDate } = getVersionData();
  process.env.BUILD_VERSION = `${currentDate}-${platform}.${commitCount}`.replaceAll("\n", "");
};
var compileTimeEnv_default = { getBuiltInVariables, setVersion, setBuildVersion };

// ../../vite.config.ts
import { networkInterfaces } from "os";
import * as path2 from "path";
import { searchForWorkspaceRoot } from "file:///C:/Projects/doc-reader/node_modules/vite/dist/node/index.js";
import ifdef from "file:///C:/Projects/doc-reader/node_modules/vite-plugin-conditional-compiler/dist/index.mjs";
import { nodePolyfills as polyfills } from "file:///C:/Projects/doc-reader/node_modules/vite-plugin-node-polyfills/dist/index.js";

// ../../scripts/sourceMaps/ViteSourceMapUploader.mjs
import glob from "file:///C:/Projects/doc-reader/node_modules/fast-glob/out/index.js";
import { unlinkSync } from "fs";
import * as path from "path";
import { BugsnagSourceMapUploaderPlugin } from "file:///C:/Projects/doc-reader/node_modules/vite-plugin-bugsnag/dist/index.js";
var ViteSourceMapUploader = () => {
  const bugsnagSourceMapUploader = BugsnagSourceMapUploaderPlugin({
    apiKey: process.env.BUGSNAG_API_KEY,
    appVersion: process.env.BUILD_VERSION
  });
  return {
    ...bugsnagSourceMapUploader,
    async writeBundle(config, bundle) {
      const outputDir = config.dir;
      try {
        await bugsnagSourceMapUploader.writeBundle(config, bundle);
      } catch (e) {
        console.error(e);
      } finally {
        const files = await glob("./**/*.map", { cwd: outputDir });
        files.forEach((file) => unlinkSync(path.resolve(outputDir, file)));
      }
    }
  };
};
var ViteSourceMapUploader_default = ViteSourceMapUploader;

// ../../vite.config.ts
var __vite_injected_original_dirname = "C:\\Projects\\doc-reader";
var { getBuiltInVariables: getBuiltInVariables2 } = compileTimeEnv_default;
if (!process.env.VITE_ENVIRONMENT) process.env.VITE_ENVIRONMENT = "next";
var isProduction = process.env.PRODUCTION === "true";
var ipv4 = networkInterfaces()?.en0?.[1]?.address ?? "localhost";
var muteWarningsPlugin = (warningsToIgnore) => {
  return {
    name: "mute-warnings",
    enforce: "pre",
    config: (userConfig) => ({
      build: {
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            if (warning.code) {
              const muted = warningsToIgnore.find(
                ([code, message]) => code == warning.code && warning.message.includes(message)
              );
              if (muted) return;
            }
            if (userConfig.build?.rollupOptions?.onwarn) {
              userConfig.build.rollupOptions.onwarn(warning, defaultHandler);
            } else {
              defaultHandler(warning);
            }
          }
        }
      }
    })
  };
};
var vite_config_default = () => ({
  cacheDir: ".vite-cache",
  logLevel: "info",
  appType: "spa",
  plugins: [
    muteWarningsPlugin([
      ["MODULE_LEVEL_DIRECTIVE", `"use-client"`],
      ["EVAL", "Use of eval"]
    ]),
    ifdef(),
    polyfills({
      protocolImports: true,
      exclude: ["buffer"]
    }),
    isProduction && ViteSourceMapUploader_default()
  ],
  clearScreen: false,
  resolve: {
    alias: {
      "@components": path2.resolve(__vite_injected_original_dirname, "core/components"),
      "@core": path2.resolve(__vite_injected_original_dirname, "core/logic"),
      "@core-ui": path2.resolve(__vite_injected_original_dirname, "core/ui-logic"),
      "@ext": path2.resolve(__vite_injected_original_dirname, "core/extensions"),
      "@app": path2.resolve(__vite_injected_original_dirname, "app"),
      "@services": path2.resolve(__vite_injected_original_dirname, "services/core"),
      "fs-extra": path2.resolve(__vite_injected_original_dirname, "core/logic/FileProvider/DiskFileProvider/DFPIntermediateCommands.ts")
    }
  },
  server: {
    sourcemapIgnoreList: (path3) => path3.includes("node_modules"),
    open: false,
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: ipv4,
      port: 5174
    },
    fs: {
      allow: [path2.join(searchForWorkspaceRoot(process.cwd(), "../../"))]
    }
  },
  define: {
    "process.version": [],
    // https://github.com/browserify/browserify-sign/issues/85
    "process.builtIn": getBuiltInVariables2(),
    "process.env.NODE_DEBUG": false
  },
  publicDir: "./core/public",
  envPrefix: ["VITE", "TAURI", "GX"],
  worker: {
    format: "es"
  },
  build: {
    target: "esnext",
    emptyOutDir: true,
    modulePreload: true,
    chunkSizeWarningLimit: 5e3,
    outDir: "dist",
    rollupOptions: {
      external: ["fsevents"]
    },
    minify: true,
    sourcemap: isProduction
  }
});

// vite.config.ts
var { setVersion: setVersion2, setBuildVersion: setBuildVersion2 } = compileTimeEnv_default;
process.env.VITE_ENVIRONMENT = "browser";
setVersion2("web");
setBuildVersion2("browser");
var nonHashableNames = ["FileInputBundle", "markdown", "jszip.min", "SwaggerUI"];
var vite_config_default2 = mergeConfig(vite_config_default(), {
  plugins: [mkcert(), react()],
  publicDir: "../../core/public",
  server: {
    hmr: {
      protocol: "wss"
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  envDir: "../..",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: (chunkInfo) => {
          if (nonHashableNames.includes(chunkInfo.name)) return "assets/[name].js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: (chunkInfo) => {
          if (nonHashableNames.includes(chunkInfo.name)) return "assets/[name].js";
          return "assets/[name]-[hash].js";
        },
        assetFileNames: (assetInfo) => {
          if (nonHashableNames.includes(assetInfo.name.replace(".css", ""))) return "assets/[name][extname]";
          return "assets/[name]-[hash][extname]";
        }
      }
    }
  }
});
export {
  vite_config_default2 as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiLi4vLi4vc2NyaXB0cy9jb21waWxlVGltZUVudi5tanMiLCAiLi4vLi4vdml0ZS5jb25maWcudHMiLCAiLi4vLi4vc2NyaXB0cy9zb3VyY2VNYXBzL1ZpdGVTb3VyY2VNYXBVcGxvYWRlci5tanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxQcm9qZWN0c1xcXFxkb2MtcmVhZGVyXFxcXGFwcHNcXFxcYnJvd3NlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcUHJvamVjdHNcXFxcZG9jLXJlYWRlclxcXFxhcHBzXFxcXGJyb3dzZXJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1Byb2plY3RzL2RvYy1yZWFkZXIvYXBwcy9icm93c2VyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgeyBVc2VyQ29uZmlnLCBtZXJnZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCBta2NlcnQgZnJvbSBcInZpdGUtcGx1Z2luLW1rY2VydFwiO1xyXG5pbXBvcnQgZW52IGZyb20gXCIuLi8uLi9zY3JpcHRzL2NvbXBpbGVUaW1lRW52Lm1qc1wiO1xyXG5pbXBvcnQgYmFzZUNvbmZpZyBmcm9tIFwiLi4vLi4vdml0ZS5jb25maWdcIjtcclxuXHJcbmNvbnN0IHsgc2V0VmVyc2lvbiwgc2V0QnVpbGRWZXJzaW9uIH0gPSBlbnY7XHJcblxyXG5wcm9jZXNzLmVudi5WSVRFX0VOVklST05NRU5UID0gXCJicm93c2VyXCI7XHJcbnNldFZlcnNpb24oXCJ3ZWJcIik7XHJcbnNldEJ1aWxkVmVyc2lvbihcImJyb3dzZXJcIik7XHJcblxyXG5jb25zdCBub25IYXNoYWJsZU5hbWVzID0gW1wiRmlsZUlucHV0QnVuZGxlXCIsIFwibWFya2Rvd25cIiwgXCJqc3ppcC5taW5cIiwgXCJTd2FnZ2VyVUlcIl07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtZXJnZUNvbmZpZyhiYXNlQ29uZmlnKCksIHtcclxuXHRwbHVnaW5zOiBbbWtjZXJ0KCksIHJlYWN0KCldLFxyXG5cdHB1YmxpY0RpcjogXCIuLi8uLi9jb3JlL3B1YmxpY1wiLFxyXG5cdHNlcnZlcjoge1xyXG5cdFx0aG1yOiB7XHJcblx0XHRcdHByb3RvY29sOiBcIndzc1wiLFxyXG5cdFx0fSxcclxuXHRcdGhlYWRlcnM6IHtcclxuXHRcdFx0XCJDcm9zcy1PcmlnaW4tT3BlbmVyLVBvbGljeVwiOiBcInNhbWUtb3JpZ2luXCIsXHJcblx0XHRcdFwiQ3Jvc3MtT3JpZ2luLUVtYmVkZGVyLVBvbGljeVwiOiBcInJlcXVpcmUtY29ycFwiLFxyXG5cdFx0fSxcclxuXHR9LFxyXG5cdGVudkRpcjogXCIuLi8uLlwiLFxyXG5cdGJ1aWxkOiB7XHJcblx0XHRyb2xsdXBPcHRpb25zOiB7XHJcblx0XHRcdG91dHB1dDoge1xyXG5cdFx0XHRcdGVudHJ5RmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XHJcblx0XHRcdFx0XHRpZiAobm9uSGFzaGFibGVOYW1lcy5pbmNsdWRlcyhjaHVua0luZm8ubmFtZSkpIHJldHVybiBcImFzc2V0cy9bbmFtZV0uanNcIjtcclxuXHRcdFx0XHRcdHJldHVybiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCI7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRjaHVua0ZpbGVOYW1lczogKGNodW5rSW5mbykgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKG5vbkhhc2hhYmxlTmFtZXMuaW5jbHVkZXMoY2h1bmtJbmZvLm5hbWUpKSByZXR1cm4gXCJhc3NldHMvW25hbWVdLmpzXCI7XHJcblx0XHRcdFx0XHRyZXR1cm4gXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiO1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0YXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcclxuXHRcdFx0XHRcdGlmIChub25IYXNoYWJsZU5hbWVzLmluY2x1ZGVzKGFzc2V0SW5mby5uYW1lLnJlcGxhY2UoXCIuY3NzXCIsIFwiXCIpKSkgcmV0dXJuIFwiYXNzZXRzL1tuYW1lXVtleHRuYW1lXVwiO1xyXG5cdFx0XHRcdFx0cmV0dXJuIFwiYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1cIjtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHR9LFxyXG5cdFx0fSxcclxuXHR9LFxyXG59IGFzIFVzZXJDb25maWcpO1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFByb2plY3RzXFxcXGRvYy1yZWFkZXJcXFxcc2NyaXB0c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcUHJvamVjdHNcXFxcZG9jLXJlYWRlclxcXFxzY3JpcHRzXFxcXGNvbXBpbGVUaW1lRW52Lm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovUHJvamVjdHMvZG9jLXJlYWRlci9zY3JpcHRzL2NvbXBpbGVUaW1lRW52Lm1qc1wiOy8qIGdsb2JhbCBwcm9jZXNzICovXHJcbmltcG9ydCBjaGlsZF9wcm9jZXNzIGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XHJcbmNvbnN0IHsgZXhlY1N5bmMgfSA9IGNoaWxkX3Byb2Nlc3M7XHJcblxyXG5jb25zdCBlbnYgPSB7XHJcblx0R1JBTUFYX1ZFUlNJT046IG51bGwsXHJcblx0QlVJTERfVkVSU0lPTjogbnVsbCxcclxuXHRCVUdTTkFHX0FQSV9LRVk6IG51bGwsXHJcblx0UFJPRFVDVElPTjogbnVsbCxcclxuXHRTRVJWRVJfQVBQOiBudWxsLFxyXG5cdFNTT19TRVJWSUNFX1VSTDogbnVsbCxcclxuXHRTU09fU0VSVklDRV9FTkNSWVBUSU9OX0tFWTogbnVsbCxcclxuXHRCVUdTTkFHX0NMSUVOVF9LRVk6IG51bGwsXHJcblx0QlJBTkNIOiBudWxsLFxyXG5cdENPT0tJRV9TRUNSRVQ6IG51bGwsXHJcblx0U0hBUkVfQUNDRVNTX1RPS0VOOiBudWxsLFxyXG5cdEFVVEhfU0VSVklDRV9VUkw6IG51bGwsXHJcblx0RElBR1JBTV9SRU5ERVJFUl9TRVJWSUNFX1VSTDogbnVsbCxcclxuXHRSRVZJRVdfU0VSVklDRV9VUkw6IG51bGwsXHJcblx0Q09SU19QUk9YWV9TRVJWSUNFX1VSTDogbnVsbCxcclxuXHRHTFNfVVJMOiBudWxsLFxyXG59O1xyXG5cclxuaWYgKCFwcm9jZXNzLmVudi5DT09LSUVfU0VDUkVUKSBjb25zb2xlLndhcm4oXCJXQVJOSU5HOiBZb3UgbmVlZCB0byBzZXQgQ09PS0lFX1NFQ1JFVCBpZiB5b3UgcnVuIGdyYW1heCBpbiBwcm9kdWN0aW9uLlwiKTtcclxuXHJcbmNvbnN0IGdldEJ1aWx0SW5WYXJpYWJsZXMgPSAoKSA9PiBPYmplY3Qua2V5cyhlbnYpLnJlZHVjZSgob2JqLCB4KSA9PiAoeyAuLi5vYmosIFt4XTogcHJvY2Vzcy5lbnZbeF0gPz8gZW52W3hdIH0pLCB7fSk7XHJcblxyXG5jb25zdCBnZXRWZXJzaW9uRGF0YSA9ICgpID0+IHtcclxuXHRjb25zdCBjb21taXRDb3VudCA9IGV4ZWNTeW5jKCdnaXQgcmV2LWxpc3QgLS1jb3VudCAtLWRhdGU9bG9jYWwgLS1hZnRlcj1cIiQoZGF0ZSArXCIlWS0lbS0wMVQwMDowMDowMFwiKVwiIEhFQUQnLCB7XHJcblx0XHRzaGVsbDogXCJiYXNoXCIsXHJcblx0fSk7XHJcblx0Y29uc3QgY3VycmVudERhdGUgPSBleGVjU3luYyhcImRhdGUgKyVZLiUtbS4lLWRcIiwgeyBzaGVsbDogXCJiYXNoXCIgfSk7XHJcblx0cmV0dXJuIHsgY29tbWl0Q291bnQsIGN1cnJlbnREYXRlIH07XHJcbn07XHJcbmNvbnN0IHNldFZlcnNpb24gPSAocGxhdGZvcm0pID0+IHtcclxuXHRjb25zdCB7IGNvbW1pdENvdW50LCBjdXJyZW50RGF0ZSB9ID0gZ2V0VmVyc2lvbkRhdGEoKTtcclxuXHRwcm9jZXNzLmVudi5HUkFNQVhfVkVSU0lPTiA9IGAke2N1cnJlbnREYXRlfS0ke3BsYXRmb3JtfS4ke2NvbW1pdENvdW50fWAucmVwbGFjZUFsbChcIlxcblwiLCBcIlwiKTtcclxufTtcclxuXHJcbmNvbnN0IHNldEJ1aWxkVmVyc2lvbiA9IChwbGF0Zm9ybSkgPT4ge1xyXG5cdGNvbnN0IHsgY29tbWl0Q291bnQsIGN1cnJlbnREYXRlIH0gPSBnZXRWZXJzaW9uRGF0YSgpO1xyXG5cdHByb2Nlc3MuZW52LkJVSUxEX1ZFUlNJT04gPSBgJHtjdXJyZW50RGF0ZX0tJHtwbGF0Zm9ybX0uJHtjb21taXRDb3VudH1gLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCJcIik7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7IGdldEJ1aWx0SW5WYXJpYWJsZXMsIHNldFZlcnNpb24sIHNldEJ1aWxkVmVyc2lvbiB9O1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFByb2plY3RzXFxcXGRvYy1yZWFkZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFByb2plY3RzXFxcXGRvYy1yZWFkZXJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1Byb2plY3RzL2RvYy1yZWFkZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBuZXR3b3JrSW50ZXJmYWNlcyB9IGZyb20gXCJvc1wiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IFBsdWdpbiwgVXNlckNvbmZpZywgc2VhcmNoRm9yV29ya3NwYWNlUm9vdCB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCBpZmRlZiBmcm9tIFwidml0ZS1wbHVnaW4tY29uZGl0aW9uYWwtY29tcGlsZXJcIjtcclxuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyBhcyBwb2x5ZmlsbHMgfSBmcm9tIFwidml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHNcIjtcclxuaW1wb3J0IGVudiBmcm9tIFwiLi9zY3JpcHRzL2NvbXBpbGVUaW1lRW52Lm1qc1wiO1xyXG5pbXBvcnQgVml0ZVNvdXJjZU1hcFVwbG9hZGVyIGZyb20gXCIuL3NjcmlwdHMvc291cmNlTWFwcy9WaXRlU291cmNlTWFwVXBsb2FkZXIubWpzXCI7XHJcblxyXG5jb25zdCB7IGdldEJ1aWx0SW5WYXJpYWJsZXMgfSA9IGVudjtcclxuaWYgKCFwcm9jZXNzLmVudi5WSVRFX0VOVklST05NRU5UKSBwcm9jZXNzLmVudi5WSVRFX0VOVklST05NRU5UID0gXCJuZXh0XCI7XHJcblxyXG5jb25zdCBpc1Byb2R1Y3Rpb24gPSBwcm9jZXNzLmVudi5QUk9EVUNUSU9OID09PSBcInRydWVcIjtcclxuY29uc3QgaXB2NCA9IG5ldHdvcmtJbnRlcmZhY2VzKCk/LmVuMD8uWzFdPy5hZGRyZXNzID8/IFwibG9jYWxob3N0XCI7XHJcblxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vdml0ZWpzL3ZpdGUvaXNzdWVzLzE1MDEyXHJcbmNvbnN0IG11dGVXYXJuaW5nc1BsdWdpbiA9ICh3YXJuaW5nc1RvSWdub3JlOiBzdHJpbmdbXVtdKTogUGx1Z2luID0+IHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0bmFtZTogXCJtdXRlLXdhcm5pbmdzXCIsXHJcblx0XHRlbmZvcmNlOiBcInByZVwiLFxyXG5cdFx0Y29uZmlnOiAodXNlckNvbmZpZykgPT4gKHtcclxuXHRcdFx0YnVpbGQ6IHtcclxuXHRcdFx0XHRyb2xsdXBPcHRpb25zOiB7XHJcblx0XHRcdFx0XHRvbndhcm4od2FybmluZywgZGVmYXVsdEhhbmRsZXIpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHdhcm5pbmcuY29kZSkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnN0IG11dGVkID0gd2FybmluZ3NUb0lnbm9yZS5maW5kKFxyXG5cdFx0XHRcdFx0XHRcdFx0KFtjb2RlLCBtZXNzYWdlXSkgPT4gY29kZSA9PSB3YXJuaW5nLmNvZGUgJiYgd2FybmluZy5tZXNzYWdlLmluY2x1ZGVzKG1lc3NhZ2UpLFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdFx0aWYgKG11dGVkKSByZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmICh1c2VyQ29uZmlnLmJ1aWxkPy5yb2xsdXBPcHRpb25zPy5vbndhcm4pIHtcclxuXHRcdFx0XHRcdFx0XHR1c2VyQ29uZmlnLmJ1aWxkLnJvbGx1cE9wdGlvbnMub253YXJuKHdhcm5pbmcsIGRlZmF1bHRIYW5kbGVyKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRkZWZhdWx0SGFuZGxlcih3YXJuaW5nKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHR9LFxyXG5cdFx0fSksXHJcblx0fTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0ICgpOiBVc2VyQ29uZmlnID0+ICh7XHJcblx0Y2FjaGVEaXI6IFwiLnZpdGUtY2FjaGVcIixcclxuXHRsb2dMZXZlbDogXCJpbmZvXCIsXHJcblx0YXBwVHlwZTogXCJzcGFcIixcclxuXHJcblx0cGx1Z2luczogW1xyXG5cdFx0bXV0ZVdhcm5pbmdzUGx1Z2luKFtcclxuXHRcdFx0W1wiTU9EVUxFX0xFVkVMX0RJUkVDVElWRVwiLCBgXCJ1c2UtY2xpZW50XCJgXSxcclxuXHRcdFx0W1wiRVZBTFwiLCBcIlVzZSBvZiBldmFsXCJdLFxyXG5cdFx0XSksXHJcblx0XHRpZmRlZigpLFxyXG5cdFx0cG9seWZpbGxzKHtcclxuXHRcdFx0cHJvdG9jb2xJbXBvcnRzOiB0cnVlLFxyXG5cdFx0XHRleGNsdWRlOiBbXCJidWZmZXJcIl0sXHJcblx0XHR9KSxcclxuXHRcdGlzUHJvZHVjdGlvbiAmJiBWaXRlU291cmNlTWFwVXBsb2FkZXIoKSxcclxuXHRdLFxyXG5cclxuXHRjbGVhclNjcmVlbjogZmFsc2UsXHJcblxyXG5cdHJlc29sdmU6IHtcclxuXHRcdGFsaWFzOiB7XHJcblx0XHRcdFwiQGNvbXBvbmVudHNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJjb3JlL2NvbXBvbmVudHNcIiksXHJcblx0XHRcdFwiQGNvcmVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJjb3JlL2xvZ2ljXCIpLFxyXG5cdFx0XHRcIkBjb3JlLXVpXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiY29yZS91aS1sb2dpY1wiKSxcclxuXHRcdFx0XCJAZXh0XCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiY29yZS9leHRlbnNpb25zXCIpLFxyXG5cdFx0XHRcIkBhcHBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJhcHBcIiksXHJcblx0XHRcdFwiQHNlcnZpY2VzXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic2VydmljZXMvY29yZVwiKSxcclxuXHRcdFx0XCJmcy1leHRyYVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImNvcmUvbG9naWMvRmlsZVByb3ZpZGVyL0Rpc2tGaWxlUHJvdmlkZXIvREZQSW50ZXJtZWRpYXRlQ29tbWFuZHMudHNcIiksXHJcblx0XHR9LFxyXG5cdH0sXHJcblxyXG5cdHNlcnZlcjoge1xyXG5cdFx0c291cmNlbWFwSWdub3JlTGlzdDogKHBhdGgpID0+IHBhdGguaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIiksXHJcblx0XHRvcGVuOiBmYWxzZSxcclxuXHRcdGhvc3Q6IFwibG9jYWxob3N0XCIsXHJcblx0XHRwb3J0OiA1MTczLFxyXG5cdFx0c3RyaWN0UG9ydDogdHJ1ZSxcclxuXHRcdGhtcjoge1xyXG5cdFx0XHRwcm90b2NvbDogXCJ3c1wiLFxyXG5cdFx0XHRob3N0OiBpcHY0LFxyXG5cdFx0XHRwb3J0OiA1MTc0LFxyXG5cdFx0fSxcclxuXHRcdGZzOiB7XHJcblx0XHRcdGFsbG93OiBbcGF0aC5qb2luKHNlYXJjaEZvcldvcmtzcGFjZVJvb3QocHJvY2Vzcy5jd2QoKSwgXCIuLi8uLi9cIikpXSxcclxuXHRcdH0sXHJcblx0fSxcclxuXHJcblx0ZGVmaW5lOiB7XHJcblx0XHRcInByb2Nlc3MudmVyc2lvblwiOiBbXSwgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvYnJvd3NlcmlmeS1zaWduL2lzc3Vlcy84NVxyXG5cdFx0XCJwcm9jZXNzLmJ1aWx0SW5cIjogZ2V0QnVpbHRJblZhcmlhYmxlcygpLFxyXG5cdFx0XCJwcm9jZXNzLmVudi5OT0RFX0RFQlVHXCI6IGZhbHNlLFxyXG5cdH0sXHJcblx0cHVibGljRGlyOiBcIi4vY29yZS9wdWJsaWNcIixcclxuXHRlbnZQcmVmaXg6IFtcIlZJVEVcIiwgXCJUQVVSSVwiLCBcIkdYXCJdLFxyXG5cclxuXHR3b3JrZXI6IHtcclxuXHRcdGZvcm1hdDogXCJlc1wiLFxyXG5cdH0sXHJcblxyXG5cdGJ1aWxkOiB7XHJcblx0XHR0YXJnZXQ6IFwiZXNuZXh0XCIsXHJcblx0XHRlbXB0eU91dERpcjogdHJ1ZSxcclxuXHRcdG1vZHVsZVByZWxvYWQ6IHRydWUsXHJcblx0XHRjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMDAsXHJcblx0XHRvdXREaXI6IFwiZGlzdFwiLFxyXG5cdFx0cm9sbHVwT3B0aW9uczoge1xyXG5cdFx0XHRleHRlcm5hbDogW1wiZnNldmVudHNcIl0sXHJcblx0XHR9LFxyXG5cdFx0bWluaWZ5OiB0cnVlLFxyXG5cdFx0c291cmNlbWFwOiBpc1Byb2R1Y3Rpb24sXHJcblx0fSxcclxufSk7XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcUHJvamVjdHNcXFxcZG9jLXJlYWRlclxcXFxzY3JpcHRzXFxcXHNvdXJjZU1hcHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFByb2plY3RzXFxcXGRvYy1yZWFkZXJcXFxcc2NyaXB0c1xcXFxzb3VyY2VNYXBzXFxcXFZpdGVTb3VyY2VNYXBVcGxvYWRlci5tanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1Byb2plY3RzL2RvYy1yZWFkZXIvc2NyaXB0cy9zb3VyY2VNYXBzL1ZpdGVTb3VyY2VNYXBVcGxvYWRlci5tanNcIjsvKiBnbG9iYWwgcHJvY2VzcyAqL1xyXG5pbXBvcnQgZ2xvYiBmcm9tIFwiZmFzdC1nbG9iXCI7XHJcbmltcG9ydCB7IHVubGlua1N5bmMgfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBCdWdzbmFnU291cmNlTWFwVXBsb2FkZXJQbHVnaW4gfSBmcm9tIFwidml0ZS1wbHVnaW4tYnVnc25hZ1wiO1xyXG5cclxuY29uc3QgVml0ZVNvdXJjZU1hcFVwbG9hZGVyID0gKCkgPT4ge1xyXG5cdGNvbnN0IGJ1Z3NuYWdTb3VyY2VNYXBVcGxvYWRlciA9IEJ1Z3NuYWdTb3VyY2VNYXBVcGxvYWRlclBsdWdpbih7XHJcblx0XHRhcGlLZXk6IHByb2Nlc3MuZW52LkJVR1NOQUdfQVBJX0tFWSxcclxuXHRcdGFwcFZlcnNpb246IHByb2Nlc3MuZW52LkJVSUxEX1ZFUlNJT04sXHJcblx0fSk7XHJcblx0cmV0dXJuIHtcclxuXHRcdC4uLmJ1Z3NuYWdTb3VyY2VNYXBVcGxvYWRlcixcclxuXHRcdGFzeW5jIHdyaXRlQnVuZGxlKGNvbmZpZywgYnVuZGxlKSB7XHJcblx0XHRcdGNvbnN0IG91dHB1dERpciA9IGNvbmZpZy5kaXI7XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0YXdhaXQgYnVnc25hZ1NvdXJjZU1hcFVwbG9hZGVyLndyaXRlQnVuZGxlKGNvbmZpZywgYnVuZGxlKTtcclxuXHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XHJcblx0XHRcdH0gZmluYWxseSB7XHJcblx0XHRcdFx0Y29uc3QgZmlsZXMgPSBhd2FpdCBnbG9iKFwiLi8qKi8qLm1hcFwiLCB7IGN3ZDogb3V0cHV0RGlyIH0pO1xyXG5cdFx0XHRcdGZpbGVzLmZvckVhY2goKGZpbGUpID0+IHVubGlua1N5bmMocGF0aC5yZXNvbHZlKG91dHB1dERpciwgZmlsZSkpKTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHR9O1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgVml0ZVNvdXJjZU1hcFVwbG9hZGVyO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFTLE9BQU8sV0FBVztBQUN2VCxTQUFxQixtQkFBbUI7QUFDeEMsT0FBTyxZQUFZOzs7QUNEbkIsT0FBTyxtQkFBbUI7QUFDMUIsSUFBTSxFQUFFLFNBQVMsSUFBSTtBQUVyQixJQUFNLE1BQU07QUFBQSxFQUNYLGdCQUFnQjtBQUFBLEVBQ2hCLGVBQWU7QUFBQSxFQUNmLGlCQUFpQjtBQUFBLEVBQ2pCLFlBQVk7QUFBQSxFQUNaLFlBQVk7QUFBQSxFQUNaLGlCQUFpQjtBQUFBLEVBQ2pCLDRCQUE0QjtBQUFBLEVBQzVCLG9CQUFvQjtBQUFBLEVBQ3BCLFFBQVE7QUFBQSxFQUNSLGVBQWU7QUFBQSxFQUNmLG9CQUFvQjtBQUFBLEVBQ3BCLGtCQUFrQjtBQUFBLEVBQ2xCLDhCQUE4QjtBQUFBLEVBQzlCLG9CQUFvQjtBQUFBLEVBQ3BCLHdCQUF3QjtBQUFBLEVBQ3hCLFNBQVM7QUFDVjtBQUVBLElBQUksQ0FBQyxRQUFRLElBQUksY0FBZSxTQUFRLEtBQUsseUVBQXlFO0FBRXRILElBQU0sc0JBQXNCLE1BQU0sT0FBTyxLQUFLLEdBQUcsRUFBRSxPQUFPLENBQUMsS0FBSyxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLFFBQVEsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFD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Q3BCLG1CQUFtQkQscUJBQW9CO0FBQUEsSUFDdkMsMEJBQTBCO0FBQUEsRUFDM0I7QUFBQSxFQUNBLFdBQVc7QUFBQSxFQUNYLFdBQVcsQ0FBQyxRQUFRLFNBQVMsSUFBSTtBQUFBLEVBRWpDLFFBQVE7QUFBQSxJQUNQLFFBQVE7QUFBQSxFQUNUO0FBQUEsRUFFQSxPQUFPO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixlQUFlO0FBQUEsSUFDZix1QkFBdUI7QUFBQSxJQUN2QixRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDZCxVQUFVLENBQUMsVUFBVTtBQUFBLElBQ3RCO0FBQUEsSUFDQSxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsRUFDWjtBQUNEOzs7QUY1R0EsSUFBTSxFQUFFLFlBQUFFLGFBQVksaUJBQUFDLGlCQUFnQixJQUFJO0FBRXhDLFFBQVEsSUFBSSxtQkFBbUI7QUFDL0JELFlBQVcsS0FBSztBQUNoQkMsaUJBQWdCLFNBQVM7QUFFekIsSUFBTSxtQkFBbUIsQ0FBQyxtQkFBbUIsWUFBWSxhQUFhLFdBQVc7QUFFakYsSUFBT0MsdUJBQVEsWUFBWSxvQkFBVyxHQUFHO0FBQUEsRUFDeEMsU0FBUyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFBQSxFQUMzQixXQUFXO0FBQUEsRUFDWCxRQUFRO0FBQUEsSUFDUCxLQUFLO0FBQUEsTUFDSixVQUFVO0FBQUEsSUFDWDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1IsOEJBQThCO0FBQUEsTUFDOUIsZ0NBQWdDO0FBQUEsSUFDakM7QUFBQSxFQUNEO0FBQUEsRUFDQSxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsSUFDTixlQUFlO0FBQUEsTUFDZCxRQUFRO0FBQUEsUUFDUCxnQkFBZ0IsQ0FBQyxjQUFjO0FBQzlCLGNBQUksaUJBQWlCLFNBQVMsVUFBVSxJQUFJLEVBQUcsUUFBTztBQUN0RCxpQkFBTztBQUFBLFFBQ1I7QUFBQSxRQUNBLGdCQUFnQixDQUFDLGNBQWM7QUFDOUIsY0FBSSxpQkFBaUIsU0FBUyxVQUFVLElBQUksRUFBRyxRQUFPO0FBQ3RELGlCQUFPO0FBQUEsUUFDUjtBQUFBLFFBQ0EsZ0JBQWdCLENBQUMsY0FBYztBQUM5QixjQUFJLGlCQUFpQixTQUFTLFVBQVUsS0FBSyxRQUFRLFFBQVEsRUFBRSxDQUFDLEVBQUcsUUFBTztBQUMxRSxpQkFBTztBQUFBLFFBQ1I7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFDRCxDQUFlOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgImdldEJ1aWx0SW5WYXJpYWJsZXMiLCAicGF0aCIsICJzZXRWZXJzaW9uIiwgInNldEJ1aWxkVmVyc2lvbiIsICJ2aXRlX2NvbmZpZ19kZWZhdWx0Il0KfQo=
