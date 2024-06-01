import { exit, env, stdout } from "node:process";

try {
    const url = new URL(`https://web.whatsapp.com/check-update`);

    url.searchParams.set("version", env.WA_VERSION || 0);
    url.searchParams.set("platform", "web");

    const version = await fetch(url)
        .then(res => res.json())
        .then(data => data.currentVersion);

    stdout.write(version);
} catch (error) {
    console.error(error);
    exit(1);
}