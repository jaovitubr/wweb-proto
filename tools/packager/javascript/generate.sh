#!/bin/bash

JS_OUT=$OUT_DIR/javascript

rm -rf $JS_OUT
mkdir $JS_OUT

cp package.json $JS_OUT/package.json
cp readme.md $JS_OUT/readme.md

sed -i 's/{{WA_VERSION}}/'"$NEWEST_WA_VERSION"'/g' $JS_OUT/package.json
sed -i 's/{{WA_VERSION}}/'"$NEWEST_WA_VERSION"'/g' $JS_OUT/readme.md

pbjs -t static-module -w commonjs -o $JS_OUT/index.js $OUT_DIR/proto/*.proto
pbts -o $JS_OUT/index.d.ts $JS_OUT/index.js