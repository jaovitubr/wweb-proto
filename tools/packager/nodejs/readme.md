# WhatsApp Web Protobuf

The [package `wweb-proto`](https://www.npmjs.com/package/wweb-proto) allows javascript developers to easily access the ProtoBuffer definitions used by WhatsApp Web. This enables the programmatic analysis and manipulation of messages and other data from WhatsApp Web using the [package `@bufbuild/protoc-gen-es`](https://www.npmjs.com/package/@bufbuild/protoc-gen-es).

✨ The proto files were last modified in **WhatsApp Web version**: `{{WA_VERSION}}`.

**⚠️ This package is automatically updated when a change is detected in the proto files.**

## Installation

To install the package, use npm:

```sh
npm install wweb-proto
```

## Usage

To access the compiled ProtoBuffer objects, you can use the following code:

```javascript
const { User } = require('wweb-proto');

let user = new User({
  firstName: "Homer",
  lastName: "Simpson",
  active: true,
  locations: ["Springfield"],
  projects: { SPP: "Springfield Power Plant" },
  manager: {
    firstName: "Montgomery",
    lastName: "Burns",
  },
});

const bytes = user.toBinary();
user = User.fromBinary(bytes);
user = User.fromJsonString('{"firstName": "Homer", "lastName": "Simpson"}');
```

The extracted and compiled ProtoBuffer definitions are ready to be used. To learn how to work with these definitions, please refer to the [`bufbuild/protobuf-es` documentation](https://github.com/bufbuild/protobuf-es).

## Contributing

Contributions are welcome! If you find an issue or have a suggestion, please open an issue or submit a pull request on the [GitHub repository](https://github.com/jaovitubr/wweb-proto).
