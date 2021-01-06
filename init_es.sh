#!/bin/bash
cd /opt/app/elastic
curl -XPUT elastic:9200/documents -H 'Content-Type: application/json' -d @documents-index.json
curl -XPUT elastic:9200/links -H 'Content-Type: application/json' -d @links-index.json