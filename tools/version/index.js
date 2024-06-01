import { exit, env, stdout } from "node:process";

try {
    const url = new URL(`https://web.whatsapp.com/check-update`);

    url.searchParams.set("version", env.WA_VERSION || 0);
    url.searchParams.set("platform", "web");

    const version = await fetch(url)
        .then(res => res.json())
        .then(data => data.currentVersion);

    if (isDowngrade(env.WA_VERSION, version)) {
        // prevent downgrade
        stdout.write(env.WA_VERSION);
    } else {
        stdout.write(version);
    }
} catch (error) {
    console.error(error);
    exit(1);
}

function isDowngrade(curVersion, newVersion) {
    if (!curVersion || !newVersion) return false;

    const parseVersion = (version) => {
        return String(version).split('.').map(Number);
    };

    const [major1, minor1, patch1] = parseVersion(curVersion);
    const [major2, minor2, patch2] = parseVersion(newVersion);

    if (major1 > major2) return true;
    if (major1 < major2) return false;

    if (minor1 > minor2) return true;
    if (minor1 < minor2) return false;

    if (patch1 > patch2) return true;
    if (patch1 < patch2) return false;

    return false;
}