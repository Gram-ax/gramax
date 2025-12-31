import { getDeps } from "./core";
import { t as tSdk } from "@gramax/sdk/localization";

export const t: typeof tSdk = (...args) => getDeps().t(...args);
