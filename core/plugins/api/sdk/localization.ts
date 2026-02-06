import { t as tSdk } from "@gramax/sdk/localization";
import { getDeps } from "./core";

export const t: typeof tSdk = (...args) => getDeps().t(...args);
