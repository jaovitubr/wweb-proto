#!/bin/bash

OUT=$OUT_DIR/javascript

rm -rf $OUT
mkdir $OUT

cp package.json $OUT/package.json
cp readme.md $OUT/readme.md

sed -i 's/{{WA_VERSION}}/'"$NEWEST_WA_VERSION"'/g' $OUT/package.json
sed -i 's/{{WA_VERSION}}/'"$NEWEST_WA_VERSION"'/g' $OUT/readme.md

pbjs -t static-module -w commonjs -o $OUT/index.cjs $OUT_DIR/proto/*.proto
pbjs -t static-module -w es6 -o $OUT/index.mjs $OUT_DIR/proto/*.proto
pbts -o $OUT/index.d.ts $OUT/index.cjs

uglifyjs --compress --beautify -o $OUT/index.cjs $OUT/index.cjs
uglifyjs --compress --beautify -o $OUT/index.mjs $OUT/index.mjs