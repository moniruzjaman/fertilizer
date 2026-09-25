import { getConfig } from "./config.js";
import { build } from "./build.js";

const config = getConfig();
await build(config);
