#!/bin/bash
Red='\033[0;31m'          # Red
Green='\033[0;32m'        # Green
NC='\033[0m' # No Color
# get network id
path="${HOME}/.ethereum/${NETWORK}.json"
echo $path
network_id=$(jq '.network_id' $path)
echo $network_id

FILES="build/contracts/*"
COUNTER=0
VERIFIED=0
NOT_VERIFIED=0
for f in $FILES
do
  echo "Processing $f file..."
  network=$(jq .networks.\""${network_id}"\" $f)
  address=$(jq .networks.\""${network_id}"\".address $f)
  # take action on each file. $f store current file name
  
  if [[ "$network" != null ]];
  then
    
    COUNTER=$[$COUNTER +1]
    echo " $COUNTER "

    filename=$(basename -- "$f")
    contractname="${filename%.*}"
    echo "$filename" 
    verify_result="$(truffle run verify "$contractname" --network "${NETWORK}" --verifiers=sourcify)"
    if [[ "$verify_result" == *"Successfully verified 1 contract"* ]];
    then
        VERIFIED=$[$VERIFIED +1]
        echo -e "${Green}Verified ${contractname} at $address${NC}" 
    else
        NOT_VERIFIED=$[$NOT_VERIFIED +1]
        echo -e "${Red}Not verified ${contractname} at $address${NC}"
        echo $verify_result
    fi
    sleep 1
  fi

done

echo -e "${Green}Total verified ${VERIFIED}${NC}"

if [[ $NOT_VERIFIED > 0 ]];
then
echo -e "${Red}Total unverified ${NOT_VERIFIED}${NC}"
fi