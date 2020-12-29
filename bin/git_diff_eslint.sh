#!/bin/bash

echo '#### eslint DIFF'
# .git/hooks/pre-commit

git diff --cached --name-only --diff-filter=AM | grep '\.js$' | xargs eslint
