import { applicationBoostrap } from "./infra/application_bootstrap/index.ts";

await applicationBoostrap.init();

process.once('SIGHUP', async () => {
    await applicationBoostrap.init();
});