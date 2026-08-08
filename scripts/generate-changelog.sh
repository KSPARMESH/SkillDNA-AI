#!/bin/sh
echo "📝 Generating Changelog from Git Commit History..."
git log --oneline --decorate -n 20 > docs/CHANGELOG.md
