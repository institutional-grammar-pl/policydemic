from __future__ import absolute_import, unicode_literals

from celery import Celery
from celery.schedules import crontab

app = Celery("scheduler")
app.config_from_object('scheduler.celeryconfig')

app.conf.beat_schedule = {
    "hello-cycle": {
        "task": "scheduler.tasks.crawler_scheduler",
        "schedule": crontab(hour=2, minute=8)
    }
}

if __name__ == "__main__":
    app.start()
