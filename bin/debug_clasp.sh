#!/bin/bash

echo '#### DEBUG'
pwd
rsync -avr src/ dist/
clasp push
