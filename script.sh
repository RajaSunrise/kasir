#!/bin/bash

while true; do
    echo "Update at $(date)" >> file.txt
    echo "Update Tanggal $(date)" >> README.md
    git add .
    git commit -m "Auto commit Tanggal: $(date)"
    git push origin main  
    sleep 12
done
