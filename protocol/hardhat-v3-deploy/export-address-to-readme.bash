#!/bin/bash
set -euo pipefail

Red='\033[0;31m'          # Red
Green='\033[0;32m'        # Green
NC='\033[0m'              # No Color

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

# Add Protocol Fee Information section
echo "" >> "$path_readme"
echo "## Protocol Fee Configuration" >> "$path_readme"
echo "" >> "$path_readme"

# Check if ExchangeV2 deployment exists
exchange_file="deployments/${NETWORK}/ExchangeV2.json"
if [ -f "$exchange_file" ]; then
  exchange_address=$(jq -r .address "$exchange_file")
  
  # Get RPC URL from network config
  rpc_url=$(jq -r '.nodeUrl // .rpcUrl // .url // empty' "$path")
  if [ -z "$rpc_url" ]; then
    echo -e "${Red}No RPC URL found in config, using hardcoded fee values${NC}"
    fee_receiver="unknown"
    buyer_fee="unknown"
    seller_fee="unknown"
  else
    echo "Reading protocol fee from contract at $exchange_address..."
    # Call protocolFee() function - returns (address receiver, uint48 buyerAmount, uint48 sellerAmount)
    fee_data=$(cast call "$exchange_address" "protocolFee()(address,uint48,uint48)" --rpc-url "$rpc_url" 2>/dev/null || echo "")
    
    if [ -n "$fee_data" ]; then
      # Parse the output (cast returns newline-separated values)
      fee_receiver=$(echo "$fee_data" | sed -n '1p')
      buyer_fee=$(echo "$fee_data" | sed -n '2p')
      seller_fee=$(echo "$fee_data" | sed -n '3p')
      
      # Calculate percentage (fee is in basis points, 100 bps = 1%)
      buyer_pct=$(echo "scale=2; $buyer_fee / 100" | bc)
      seller_pct=$(echo "scale=2; $seller_fee / 100" | bc)
    else
      echo -e "${Red}Failed to read protocol fee from contract${NC}"
      fee_receiver="failed to read"
      buyer_fee="failed to read"
      seller_fee="failed to read"
      buyer_pct="?"
      seller_pct="?"
    fi
  fi
  
  echo "| Parameter | Value |" >> "$path_readme"
  echo "| --- | --- |" >> "$path_readme"
  echo "| Exchange Contract | $exchange_address |" >> "$path_readme"
  echo "| Fee Receiver | $fee_receiver |" >> "$path_readme"
  echo "| Buyer Fee | $buyer_fee bps ($buyer_pct%) |" >> "$path_readme"
  echo "| Seller Fee | $seller_fee bps ($seller_pct%) |" >> "$path_readme"
  echo "" >> "$path_readme"
  echo "Added protocol fee information for ExchangeV2"
else
  echo "No ExchangeV2 deployment found, skipping protocol fee info"
fi

echo -e "${Green}Done! Contracts table for $NETWORK written to $path_readme${NC}"
