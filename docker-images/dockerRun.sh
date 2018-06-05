echo "\n### Kill all containers...\n"
docker kill $(docker ps -qa)

echo "\n### Remove all container...\n"
docker rm $(docker ps -qa)

echo "\n### Build apache_static\n"
docker build -t apache_static ./apache-php-image/

echo "\n### Build express_dynamic\n"
docker build -t express_dynamic ./express-image/

echo "\n### Build apache_rp\n"
docker build -t express_dynamic ./apache-reverse-proxy/

echo "\n### Run apache_static container\n"
docker run -d --name apache_static res/apache_php

echo "\n### Run express_dynamic\n"
docker run -d --name express_dynamic res/express

echo "\n### Run apache_rp"
static_app=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' apache_static`
dynamic_app=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' express_dynamic`

echo "## IP of injected: static $static_app and dynamic $dynamic_app\n" 
docker run -d -p 8080:80 -e STATIC_APP=$static_app:80 -e DYNAMIC_APP=$dynamic_app:3000 --name apache_rp res/apache_rp

echo "\n### check ip apache_static container\n"
docker inspect apache_static | grep -i ipaddress

echo "\n### check ip express_dynamic conatiner\n"
docker inspect express_dynamic | grep -i ipaddress
