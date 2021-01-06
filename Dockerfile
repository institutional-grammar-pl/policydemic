FROM ubuntu:20.04

RUN apt-get update && \
    apt-get upgrade -y
RUN DEBIAN_FRONTEND="noninteractive" apt-get -y install tzdata

RUN apt-get install -yq  apt-utils python3-pip libmagickwand-dev tesseract-ocr tesseract-ocr-eng locales curl tmux links nginx

RUN curl -sL https://deb.nodesource.com/setup_15.x |  bash -
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update && \
    apt-get install -y nodejs yarn
RUN npm install pm2 -g

RUN mkdir /opt/app
WORKDIR /opt/

COPY config_docker.ini app/config.ini
COPY requirements.txt app/
COPY nginx.conf /etc/nginx/nginx.conf
RUN yarn
RUN python3 -m pip install -r /opt/app/requirements.txt


COPY backend app/backend
COPY crawler app/crawler
COPY data app/data
COPY frontend app/frontend
COPY nlpengine app/nlpengine
COPY pdfparser app/pdfparser
COPY policydemic_annotator app/policydemic_annotator
COPY elastic app/elastic
COPY scheduler app/scheduler
COPY translator app/translator
COPY entrypoint.sh app/
COPY ibm-credentials.env /root/
COPY init_content.sh /opt/app/
COPY init_es.sh /opt/app/

ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH "/opt/app"
ENV RUNNING_IN_DOCKER 1
WORKDIR /opt/app/backend
RUN yarn install
WORKDIR /opt/app/frontend
RUN yarn install
WORKDIR /opt/app

RUN ["chmod", "+x", "/opt/app/entrypoint.sh"]
RUN ["chmod", "+x", "/opt/app/init_content.sh"]
RUN ["chmod", "+x", "/opt/app/init_es.sh"]
CMD ["/opt/app/entrypoint.sh"]


