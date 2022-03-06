# ⭐Guide to write on notion

## Adding Script
create callout block and write as usual
except don't use "", '' but use backtick `

![](/src/callout.JPG)


---

# Required Env Var
< Discord > 
- BOT_TOKEN 

< Notion > 
- NOTION_TOKEN
- NOTION_HOME_ID 

< MongoDB > 
- MONGODB_SRV 

< Wit > 
- WIT_TOKEN

< Extra > 
- TIMEZONE 

# Todo

## Auth
- [ ] only discord and mongo key on server
- [ ] all the auth key stored in mongo

## Main Discord
- [x] clear channel command 
- [x] Server in heroku

## Notion
- [x] return scheduled message
- [x] create new log
- [x] return today's tasks
- [x] wit.ai set up 
- [x] wit analyzer v0.01
- [x] ask before excute
- [ ] TellMeABoutTodaysTas() => column count get error when notion block is not exactly matching
- [ ] merge -> TellMeABoutTodaysTask() , TellMeAboutTodaysLeftTask()
- [ ] move today's task to tomorrow
- [x] move to_do block between 'worklog' and 'tasks'


## Reminder / Scheduler
- [x] mongoDB store
- [x] convertWitTimeToCron()
- [x] wit_duration to cronTime -> - [ ] getCronTime() check out again

- [ ] notion 'reminder' database
------
notion formula


_hour : empty(prop("Unit")) ? if(hour(prop("Date")) + minute(prop("Date")) == 0, format(hour(prop("Edited"))), format(hour(prop("Date")))) : if(prop("Unit") == "Hour", "*/" + format(if(empty(prop("Recurring")), 1, prop("Recurring"))), "*")

------



- [ ] one time event -> clean up every in a while?
- [ ] recurring tasks
- [ ] remind later
- [ ] Every sunday, collect all uncompletes task to the new week

## communication
- [ ] alert with embeded message

## unsorted
- [ ] weather notification


## SNS
- [x] Tweeting by discord
- [ ] Tweet with Image ( uploading from discord media url doesn't work.. hm )




