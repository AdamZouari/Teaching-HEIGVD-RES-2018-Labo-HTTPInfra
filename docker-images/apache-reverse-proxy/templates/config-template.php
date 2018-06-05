<?php
  $dynamic_app = getenv('DYNAMIC_APP');
  $static_app = getenv('STATIC_APP');
?>

<VirtualHost *:80>
  ServerName demo.res.ch

  # Not available in this container
  # ErrorLog ${APACHE_LOG_DIR}/error.log
  # CustomLog ${APACHE_LOG_DIR}/access.log combined
  
  ProxyPass '/api/students/' 'http://<?php print "$dynamic_app"?>/'
  ProxyPassReverse '/api/students/' 'http://<?php print "$dynamic_app"?>/'

  ProxyPass "/" "http://<?php print "$static_app"?>/"
  ProxyPassReverse "/" "http://<?php print "$static_app"?>/"

</VirtualHost>
