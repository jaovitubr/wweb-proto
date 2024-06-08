#!/bin/bash

OUT_DIR=../../../out
NEWEST_WA_VERSION=1.0.0

PROTO_DIR=$OUT_DIR/proto
OUT=$OUT_DIR/packages/javascript
TS_OUT=$OUT/ts
CJS_OUT=$OUT/cjs
ESM_OUT=$OUT/esm
TYPES_OUT=$OUT/types

tsIndexPath=$TS_OUT/index.ts

setup() {
    echo "Setup..."

    rm -rf $OUT
    
    mkdir $OUT
    mkdir $TS_OUT
    mkdir $CJS_OUT
    mkdir $ESM_OUT
    mkdir $TYPES_OUT
    
    cp package.json $OUT/package.json
    cp readme.md $OUT/readme.md
    
    sed -i 's/{{WA_VERSION}}/'"$NEWEST_WA_VERSION"'/g' $OUT/package.json
    sed -i 's/{{WA_VERSION}}/'"$NEWEST_WA_VERSION"'/g' $OUT/readme.md
}

compile_proto() {
    protoFiles=$PROTO_DIR/*.proto
    
    (
        echo "" > $tsIndexPath
        
        for filePath in $protoFiles; do
            fileName=$(basename $filePath .proto)_pb.js
            echo "export * from './$fileName';" >> $tsIndexPath
        done
        
        echo "Generated index $tsIndexPath"
    ) &
    
    (
        protoc \
        --es_out $TS_OUT \
        --es_opt target=ts \
        --proto_path $OUT_DIR/proto/ \
        $protoFiles
        
        echo "Compiled protocol buffer files $protoFiles"
    ) &
    
    wait
}

compile_ts() {
    (
        tsc $tsIndexPath --module commonjs --outdir $CJS_OUT
        echo "Compiled commonjs $CJS_OUT"
    ) &
    
    (
        tsc $tsIndexPath --module esnext --outdir $ESM_OUT
        echo "Compiled esnext $ESM_OUT"
    ) &
    
    (
        tsc $tsIndexPath --declaration --emitDeclarationOnly --outdir $TYPES_OUT
        echo "Compiled types $TYPES_OUT"
    ) &
    
    wait
    rm -rf $TS_OUT
}

minify() {
    jsFiles=($CJS_OUT/*.js $ESM_OUT/*.js)
    
    for filePath in "${jsFiles[@]}"; do
        (
            uglifyjs $filePath \
            --compress \
            -o $filePath
            
            echo Minified "$filePath"
        ) &
    done
    
    wait
}

set -e

setup
compile_proto
compile_ts
minify