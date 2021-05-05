#!/bin/bash
cd /opt/app/
service nginx start
# python3 -m celery -A scheduler flower &
# python3 -m celery -A scheduler beat &
# python3 -m celery -A scheduler worker -l info -n light -Q light &
# python3 -m celery -A scheduler worker -l info -n crawler -Q crawler &
# pm2 start app/backend/index.js --name policydemic -i 1 &
python3 -m celery -A scheduler worker -l info
tmux new-session -d -s "celery_flower" python3 -m celery -A scheduler flower
tmux new-session -d -s "celery_beat" python3 -m celery -A scheduler beat
tmux new-session -d -s "light_worker" python3 -m celery -A scheduler worker -l info -n light -Q light
tmux new-session -d -s "crawler_worker" python3 -m celery -A scheduler worker -l info -n crawler -Q crawler
pm2 start /opt/app/backend/index.js --name policydemic -i 1
tmux new-session -s "main_worker" python3 -m celery -A scheduler worker -l info -n general