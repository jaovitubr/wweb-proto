const protoConstants = moduleRaid["WAProtoConst"];
const protoFiles = loadProtoFiles();

console.log({
    protoConstants,
    protoFiles,
});

function loadProtoFiles() {
    const protoModuleFiles = {};

    for (const moduleId in moduleRaid) {
        if (moduleId.endsWith(".pb")) {
            const protoFileName = moduleId
                .replace(/^(WAWebProtobufs|WAWebProtobuf|WAProtobufs|WA)/g, "")
                .replace(".pb", "");

            if (
                !moduleId.startsWith("WAWeb") &&
                protoFileName in protoModuleFiles
            ) continue;

            protoModuleFiles[protoFileName] = moduleRaid[moduleId];
        }
    }

    const protoFiles = {};

    Object.entries(protoModuleFiles)
        .forEach(([protoFileName, protoModule]) => {
            const tree = [];

            Object.entries(protoModule)
                .map(([key, data]) => ({ path: key.replace(/Spec$/, "").split("$"), data }))
                .sort((a, b) => a.path.length - b.path.length)
                .forEach((proto) => {
                    proto.path.reduce((acc, name) => {
                        const existingNode = acc.find(p => p.name === name);
                        if (existingNode) return existingNode.children;

                        const newNode = {
                            type: "",
                            name,
                            path: proto.path,
                            children: [],
                            data: proto.data,
                        }

                        if (proto.data.internalSpec) newNode.type = "message";
                        else newNode.type = "enum";  // Assumir tipo enum se não for uma mensagem

                        acc.push(newNode);
                        return newNode.children;
                    }, tree);
                });

            protoFiles[protoFileName] = tree;
        });

    return protoFiles;
}

function extractFieldInfo(fieldSpec) {
    const [order, typeAndFlags, typeSpec] = fieldSpec;

    const FLAGS = {
        REPEATED: 64,
        REQUIRED: 256,
    };

    const OPTIONS = {
        PACKED: 128,
        DEPRECATED: 512,
    };

    const typeValue = typeAndFlags & protoConstants.TYPE_MASK;
    const flagsValue = typeAndFlags & ~protoConstants.TYPE_MASK;

    const type = Object.keys(protoConstants.TYPES)
        .find(key => protoConstants.TYPES[key] === typeValue)
        ?.toLowerCase();

    const flags = Object.keys(FLAGS)
        .filter(flag => flagsValue & FLAGS[flag])
        .map(flag => flag.toLowerCase());

    if (!flags.length) flags.push("optional");

    const options = Object.keys(OPTIONS)
        .filter(flag => flagsValue & OPTIONS[flag])
        .map(flag => flag.toLowerCase());

    return { order, type, typeSpec, flags, options };
}

function determineFieldSpecName(typeSpec, currentPath = []) {
    if (!typeSpec) return null;

    const currentPathStr = currentPath.join(".");

    function findInNodes(nodes) {
        for (const node of nodes) {
            let name = null;

            if (typeSpec === node.data) {
                name = node.path.join(".");

                if (name.startsWith(currentPathStr)) {
                    name = name.replace(`${currentPathStr}.`, "");
                }

                return name;
            } else if (node.children.length > 0) {
                name = findInNodes(node.children);
            }

            if (name) return name;
        }
    }

    for (const protoFile of Object.values(protoFiles)) {
        const name = findInNodes(protoFile);
        if (name) return name;
    }
}

function isFieldInOneOf(fieldName, node) {
    const { internalSpec } = node.data;
    const oneOfGroups = internalSpec[protoConstants.KEYS.ONEOF];

    for (const oneOfFields of Object.values(oneOfGroups)) {
        if (oneOfFields.includes(fieldName)) return true;
    }

    return false;
}

function serializeOneOfGroups(node) {
    const { internalSpec } = node.data;
    const oneOfGroups = internalSpec[protoConstants.KEYS.ONEOF];

    const oneOfSpecs = Object.entries(oneOfGroups).map(([oneOfName, oneOfFields]) => {
        const fieldsSpecs = oneOfFields
            .map(fieldName => {
                const fieldSpec = internalSpec[fieldName];
                return serializeField(node, fieldName, fieldSpec, true);
            })
            .join("\n")
            .replace(/(^|\n)/g, `$1\t`);

        let oneOfSpec = `oneof ${oneOfName} {`;
        if (fieldsSpecs.length > 0) oneOfSpec += `\n${fieldsSpecs}\n`;
        oneOfSpec += "}";

        return oneOfSpec;
    });

    return oneOfSpecs.join("\n\n");
}

function serializeField(node, fieldName, fieldSpec, isOneOf = false) {
    if (node.type === "message") {
        let { order, type, typeSpec, flags, options } = extractFieldInfo(fieldSpec);
        const typeSpecName = determineFieldSpecName(typeSpec, node.path) || type;

        if (isOneOf) {
            flags = flags.filter(flag => !["required", "optional"].includes(flag));
        }

        const flagsStr = flags.length ? `${flags.join(" ")} ` : "";
        const optionsStr = options.length ? ` [${options.map(option => `${option}=true`).join(", ")}]` : "";

        return `${flagsStr}${typeSpecName} ${fieldName} = ${order}${optionsStr};`;
    } else if (node.type === "enum") {
        const order = fieldSpec;
        return `${fieldName} = ${order};`;
    }
}

function serializeNode(node, level = 0) {
    let nodeProto = `${node.type} ${node.name} {`

    if (node.type === "message") {
        const { internalSpec } = node.data;
        const hasOneOfGroups = protoConstants.KEYS.ONEOF in internalSpec;

        const fieldsSpecs = Object.entries(internalSpec)
            .map(([fieldName, fieldSpec]) => {
                if (hasOneOfGroups && fieldName === protoConstants.KEYS.ONEOF) return;
                else if (hasOneOfGroups && isFieldInOneOf(fieldName, node)) return;

                return serializeField(node, fieldName, fieldSpec);
            })
            .filter(spec => !!spec);

        if (fieldsSpecs.length > 0) nodeProto += `\n\t${fieldsSpecs.join("\n\t")}\n`;

        if (hasOneOfGroups) {
            const oneOfGroupsSpecs = serializeOneOfGroups(node)
                .replace(/(^|\n)/g, `$1\t`);

            nodeProto += `\n${oneOfGroupsSpecs}\n`;
        }
    } else if (node.type === "enum") {
        const enumSpecs = Object.getOwnPropertyNames(node.data)
            .map((fieldName) => {
                const fieldSpec = node.data[fieldName];

                return serializeField(node, fieldName, fieldSpec);
            });

        if (enumSpecs.length > 0) nodeProto += `\n\t${enumSpecs.join("\n\t")}\n`;
    }

    const childNodesSpecs = node.children.map(childNode => serializeNode(childNode, level + 1));
    if (childNodesSpecs.length > 0) nodeProto += `\n${childNodesSpecs.join("\n\n")}\n`;

    nodeProto += `}`;

    if (level > 0) nodeProto = nodeProto.replace(/(^|\n)/g, `$1\t`);

    return nodeProto;
}

const protoBufDefinitions = {};

for (const protoName in protoFiles) {
    const protoFileTree = protoFiles[protoName];

    let protoContent = `syntax = "proto2";\n\n`;
    // protoContent += `package ${protoName};\n\n`;
    protoContent += protoFileTree.map(node => serializeNode(node)).join("\n\n");

    protoBufDefinitions[protoName] = protoContent;
}

return protoBufDefinitions;
