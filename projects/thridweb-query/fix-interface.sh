#!/bin/bash

# Define the search and replace strings with escaped double quotes
search_string=" as interface from"
replace_string=" as interfaces from"

# Specify the root folder where you want to perform the replacement
root_folder="./typechain-types"

# Use find to locate all text files in the specified folder and its subfolders
find "$root_folder" -type f -name "*.ts" -print0 | while IFS= read -r -d $'\0' file; do
    # Use sed to perform the replacement, using the escaped search and replace strings
    sed "s/$search_string/$replace_string/g" "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
    echo "Replaced in $file"
done

# Define the search and replace strings with escaped double quotes
search_string="export type { interface }"
replace_string="export type { interfaces }"

# Specify the root folder where you want to perform the replacement
root_folder="./typechain-types"

# Use find to locate all text files in the specified folder and its subfolders
find "$root_folder" -type f -name "*.ts" -print0 | while IFS= read -r -d $'\0' file; do
    # Use sed to perform the replacement, using the escaped search and replace strings
    sed "s/$search_string/$replace_string/g" "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
    echo "Replaced in $file"
done

echo "Replacement complete."
