#!/usr/bin/python3
import os

os.chdir('/opt/app/')

from crawler.tasks import crawl_ilo
from crawler.tasks import crawl_policy_watch
from crawler.tasks import scrape_imf
from scheduler.tasks import crawler_scheduler

scrape_imf.delay()
crawl_ilo.delay()
crawl_policy_watch.delay()
crawler_scheduler.delay()
