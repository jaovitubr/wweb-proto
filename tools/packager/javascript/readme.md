# WhatsApp Web Protobuf

The [package `wweb-proto`](https://www.npmjs.com/package/wweb-proto) allows javascript developers to easily access the ProtoBuffer definitions used by WhatsApp Web. This enables the programmatic analysis and manipulation of messages and other data from WhatsApp Web using the [package `@bufbuild/protoc-gen-es`](https://www.npmjs.com/package/@bufbuild/protoc-gen-es).

✨ The proto files were last modified in **WhatsApp Web version**: `{{WA_VERSION}}`.

**⚠️ This package automatically updates when a new version of the proto files is detected.**

## Installation

To install the package, use npm:

```sh
npm install wweb-proto
```

## Usage

To access the compiled ProtoBuffer objects, you can use the following code:

```javascript
const { Message, MessageKey, ... } = require('wweb-proto');

const message = Message.create({ awesomeField: "AwesomeString" });

const buffer = Message.encode(message).finish();
const decodedMessage = Message.decode(buffer);
```

The extracted and compiled ProtoBuffer definitions are ready to be used. To learn how to work with these definitions, please refer to the [`bufbuild/protobuf-es` documentation](https://github.com/bufbuild/protobuf-es).

## Contributing

Contributions are welcome! If you find an issue or have a suggestion, please open an issue or submit a pull request on the [GitHub repository](https://github.com/jaovitubr/wweb-proto).
