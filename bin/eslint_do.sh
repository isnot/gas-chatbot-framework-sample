#!/bin/bash

echo '#### eslint APPS'
ls src/*.js | xargs npx eslint
echo '#### eslint CORE'
ls src/core/*.js | xargs npx eslint
echo '#### eslint PLUGINS'
ls src/plugins/*.js | xargs npx eslint
