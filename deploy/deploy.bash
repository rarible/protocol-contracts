#!/bin/bash

if [ -z "$MIGRATE_FROM" ]
then
    echo "truffle migrate all --network ${NETWORK} --contracts_build_directory=./build/${NETWORK}"
    truffle migrate all --network ${NETWORK} --contracts_build_directory=./build/${NETWORK}
else
    echo "truffle migrate -f ${MIGRATE_FROM} --to ${MIGRATE_TO} --network ${NETWORK} --contracts_build_directory=./build/${NETWORK}"
    truffle migrate -f ${MIGRATE_FROM} --to ${MIGRATE_TO} --network ${NETWORK} --contracts_build_directory=./build/${NETWORK}
fi