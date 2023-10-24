#!/bin/bash

FILE_PATCH="patches/${NETWORK}.patch"

if test -f "$FILE_PATCH"; then
    echo "$FILE_PATCH exists."
    echo $(pwd)
    echo $(git apply --ignore-space-change --ignore-whitespace $FILE_PATCH)
else 
    echo "$FILE_PATCH not exists."
fi