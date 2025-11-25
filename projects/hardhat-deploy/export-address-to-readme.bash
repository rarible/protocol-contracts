#!/bin/bash
set -euo pipefail
Red='\033[0;31m' # Red
Green='\033[0;32m' # Green
NC='\033[0m' # No Color
# Usage: NETWORK=mainnet ./this_script.sh
# get network id
NETWORK="${NETWORK:-}"
if [ -z "$NETWORK" ]; then
  echo -e "${Red}NETWORK env var not set!${NC}"
  exit 1
fi
path="${HOME}/.ethereum/${NETWORK}.json"
path_readme="networks/${NETWORK}.md"
echo "--------------------------------"
echo "Generating network readme for: $NETWORK"
echo "Picking chain configuration at path: $path"
# Get explorerUrl from JSON (first try .verify.explorerUrl, fallback to .explorer_url)
explorer_url=$(jq -r '.verify.explorerUrl // .explorer_url // empty' "$path")
echo -e "${Red}$explorer_url!${NC}"
if [ -z "$explorer_url" ]; then
  echo -e "${Red}No explorer URL found in config!${NC}"
  exit 1
fi
# Function to add a row to the table
add_row() {
  printf " %s | %s | %s\n" "$1" "$2" "$3" >> "$path_readme"
}
# Function to add the table header
add_header() {
  printf " %s | %s | %s\n" "$1" "$2" "$3" > "$path_readme"
  echo " --- | --- | ---" >> "$path_readme"
}
# Make sure README file exists and is empty before writing
mkdir -p "$(dirname "$path_readme")"
: > "$path_readme"
FILES="deployments/${NETWORK}/*"
COUNTER=0
add_header "Name" "Address" "Url"
for f in $FILES; do
  # Skip unwanted files
  if [[ $f == *"_Proxy"* || $f == *"_Implementation"* || $f == *"solcInputs"* ]]; then
    continue
  fi
  if [ ! -f "$f" ]; then
    continue
  fi
  echo "Processing $f file..."
  address=$(jq -r .address "$f")
  if [ -z "$address" ]; then
    echo "No address in $f, skipping."
    continue
  fi
  COUNTER=$((COUNTER + 1))
  filename=$(basename -- "$f")
  contractname="${filename%.*}"
  url="${explorer_url%/}/address/$address"
  add_row "$contractname" "$address" "$url"
  echo "Added $contractname ($address) → $url"
  sleep 1
done

echo "" >> "$path_readme"
echo "## Protocol Fees and Ownerships" >> "$path_readme"
npx hardhat export-fees-and-ownerships --depdir $NETWORK >> "$path_readme"

echo -e "${Green}Done! Contracts table for $NETWORK written to $path_readme${NC}"