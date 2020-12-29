#!/bin/bash

echo '#### DIFFFILES'
pwd

clasp pull
diff -u src/ dist/
diff -u src/core/ dist/core/
diff -u src/plugins/ dist/plugins/
