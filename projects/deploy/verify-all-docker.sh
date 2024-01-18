docker build . -f deploy/verify.Dockerfile -t rariverify
docker run  --rm --env-file .env --mount type=bind,source=$HOME/.ethereum,target=/root/.ethereum,readonly rariverify