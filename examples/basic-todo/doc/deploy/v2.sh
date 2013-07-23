#!/bin/bash

# Copy this script to $HOME and run it

path=/srv/www/todo
tmp=/srv/www/tmp

echo 'Cloning repo from github...'
git clone git@github.com:dreamerslab/express-todo-example.git $tmp
echo '...done!'
echo ''

echo 'Removing development files...'
sudo rm $tmp/README.md
sudo rm -fr $tmp/doc
echo '...done!'
echo ''

echo 'Installing dependency modules...'
cd $tmp
npm install
echo '...done!'
echo ''

echo 'Backing up old version...'
mv $path $path`date +"%Y%m%d%H%M%S"`
echo '...done!'
echo ''

echo 'Stopping iceberg server...'
sudo stop todo
echo '...done!'
echo ''

echo 'Switch to latest version...'
mv $tmp $path
echo '...done!'
echo ''

echo 'Starting iceberg server...'
sudo start todo
echo '...done!'
echo ''