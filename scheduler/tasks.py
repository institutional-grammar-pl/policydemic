from scheduler.celery import app
from celery.schedules import crontab


# @app.on_after_configure.connect
# def crawler_schedule(sender, **kwargs):
#     cron_cycle = crontab(hour=22, minute=10, day_of_week=1)

#     sender.add_periodic_task(cron_cycle, run_crawl_gov_du.s())
#     sender.add_periodic_task(cron_cycle, run_crawl_gov_mp.s())
#     sender.add_periodic_task(cron_cycle, crawl_cgrt_countries.s())
