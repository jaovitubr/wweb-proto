#!/bin/bash

PROTO_DIR=$OUT_DIR/proto
OUT=$OUT_DIR/packages/nodejs
TS_OUT=$OUT/ts
TYPES_OUT=$OUT/types
CJS_OUT=$OUT/cjs
ESM_OUT=$OUT/esm

tsIndexPath=$TS_OUT/index.ts

setup() {
    echo "Setup..."
    
    rm -rf $OUT
    
    mkdir -p $OUT
    mkdir $TS_OUT
    mkdir $TYPES_OUT
    mkdir $ESM_OUT
    mkdir $CJS_OUT
    
    cp package.json $OUT/package.json
    cp readme.md $OUT/readme.md
    
    sed -i 's/{{WA_VERSION}}/'"$NEWEST_WA_VERSION"'/g' $OUT/package.json
    sed -i 's/{{WA_VERSION}}/'"$NEWEST_WA_VERSION"'/g' $OUT/readme.md
}

compile_proto() {
    echo "" > $tsIndexPath
    echo "export const HASH = '$NEWEST_WA_PROTO_MD5';" >> $tsIndexPath
    echo "export const VERSION = '$NEWEST_WA_VERSION';" >> $tsIndexPath
        
    echo "Generated index"
    
    for protoFile in $PROTO_DIR/*.proto; do
        (
            protoc \
            --es_out $TS_OUT \
            --es_opt target=ts \
            --proto_path $OUT_DIR/proto/ \
            "$protoFile"
        ) &
    done
    
    wait

    echo "Compiled protocol buffers"
}

compile_js() {
    tsFilesArray=($TS_OUT/*.ts)
    tsFilesStr=${tsFilesArray[@]}
    pids=()
    
    (
        set -e
        tsc $tsFilesStr --declaration --emitDeclarationOnly --noCheck --outdir $TYPES_OUT
        echo "Compiled types"
    ) &
    pids+=($!)
    
    (
        set -e
        tsc $tsFilesStr --module commonjs --target es2022 --noCheck --outdir $CJS_OUT
        echo "Compiled commonjs"
    ) &
    pids+=($!)
    
    (
        set -e
        tsc $tsFilesStr --module esnext --target es2022 --noCheck --outdir $ESM_OUT
        echo "Compiled esm"
    ) &
    pids+=($!)
    
    for pid in "${pids[@]}"; do
        wait $pid || {
            echo "A task in compile_ts failed!"
            exit 1
        }
    done
    
    rm -rf $TS_OUT
}

minify() {
    for filePath in $CJS_OUT/*.js $ESM_OUT/*.js; do
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
compile_js
# minify