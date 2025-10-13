#!/bin/bash
echo "Enter your GitHub Personal Access Token:"
read -s TOKEN
git remote set-url origin https://$TOKEN@github.com/MylesNdlovu/trendstec-clientflow.git
git push -u origin main
echo "✅ Code pushed to GitHub!"
