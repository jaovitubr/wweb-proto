#!/bin/bash

# OUT_DIR=../../../out
# NEWEST_WA_VERSION=1.0.0

PROTO_DIR=$OUT_DIR/proto
OUT=$OUT_DIR/packages/javascript
TS_OUT=$OUT/ts
ESM_OUT=$OUT/esm

tsIndexPath=$TS_OUT/index.ts

setup() {
    echo "Setup..."
    
    rm -rf $OUT
    
    mkdir $OUT
    mkdir $TS_OUT
    mkdir $ESM_OUT
    
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
        tsc $tsIndexPath --declaration --emitDeclarationOnly --outdir $OUT
        echo "Compiled types"
    ) &
    
    (
        tsc $tsIndexPath --module commonjs --target es2022 --outdir $OUT
        echo "Compiled commonjs"
    ) &
    
    (
        tsc $tsIndexPath --module esnext --target es2022 --outdir $ESM_OUT
        
        for file in $ESM_OUT/*.js; do
            baseName=$(basename $file)
            fileName="${baseName%.js}"
            
            mv "$file" "$OUT/$fileName.mjs"
        done
        
        rm -rf $ESM_OUT
        echo "Compiled esnext"
    ) &
    
    wait
    # rm -rf $TS_OUT
}

minify() {
    for filePath in $OUT/*.{js,mjs}; do
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