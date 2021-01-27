# Nodejs Backend

## Running the server
In order to run a server, run following command
```bash
yarn run start 
````

### Tests

In order to run tests just run `yarn test` inside this directory.

### Setup local instance of ElasticSearch

To setup local instance of ElasticSearch just execute this command

```bash
docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.8.0
```
Elastic will be available under `localhost:9200`