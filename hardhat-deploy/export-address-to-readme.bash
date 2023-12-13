#!/bin/bash
Red='\033[0;31m'          # Red
Green='\033[0;32m'        # Green
NC='\033[0m' # No Color
# get network id
path="${HOME}/.ethereum/${NETWORK}.json"
path_readme="networks/${NETWORK}.md"
echo $path
network_id=$(jq '.network_id' $path)
explorer_url=$(jq '.verify.explorerUrl' $path)
echo $network_id

# Function to add a row to the table
add_row() {
  echo " $1 | $2 | $3 " >> $path_readme
}

# Function to add the table header
add_header() {
  echo " $1 | $2 | $3 " > $path_readme
  echo " --- | --- | ---" >> $path_readme
}

# Check if README.md already exists; if not, create it
if [ ! -f $path_readme ]; then
  touch $path_readme
fi

FILES="deployments/${NETWORK}/*"
COUNTER=0
VERIFIED=0
NOT_VERIFIED=0
add_header "Name" "Address" "Url"
for f in $FILES
do
  echo "Processing $f file..."
  address=$(jq .address $f)
  
  # take action on each file. $f store current file name
  if [[ $f != *"_Proxy"* && $f != *"_Implementation"* && $f != *"solcInputs"* ]];
  then
    
    COUNTER=$[$COUNTER +1]
    echo " $COUNTER "

    filename=$(basename -- "$f")
    contractname="${filename%.*}"
    echo "$filename" 
    formated_address=$(echo "$address" | tr -d "\"")
    formated_explorer_url=$(echo "$explorer_url" | tr -d "\"")
    add_row "$contractname" $formated_address $formated_explorer_url"address/"$formated_address

    sleep 1
  fi

done

