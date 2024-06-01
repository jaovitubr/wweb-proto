import crypto from "node:crypto";

export function calculateProtosMd5(protos) {
    const contents = Object.entries(protos)
        .sort()
        .map((key, val) => `${key}:${val}`)
        .join("\n");

    return crypto.createHash("md5")
        .update(contents)
        .digest("hex");
}