# ⭐Guide to write on notion

## Clon Time
![](/src/cron.JPG)

This is the fomula to get the cron time.
Pretty sure it can be simpler and clear but for now, it looks like this. 

- _minute : 
```
empty(prop("Unit")) ? if(minute(prop("Date")) + minute(prop("Date")) == 0, format(minute(prop("Edited"))), format(minute(prop("Date")))) : if(prop("Unit") == "minute", "*/" + format(if(empty(prop("Recurring")), 1, prop("Recurring"))), if(prop("Unit") != "hour" or prop("Unit") != "minute", if(empty(prop("Date")), if(empty(prop("Date")), format(minute(prop("Edited"))), format(minute(prop("Date")))), format(minute(prop("Date")))), "*"))
```


- _hour_ : 
```
empty(prop("Unit")) ? if(hour(prop("Date")) + hour(prop("Date")) == 0, format(hour(prop("Edited"))), format(hour(prop("Date")))) : if(prop("Unit") == "hour", "*/" + format(if(empty(prop("Recurring")), 1, prop("Recurring"))), if(prop("Unit") != "minute", format(hour(prop("Date"))), if(prop("Unit") != "hour", "*", format(hour(prop("Date"))))))
```


- _day : 
```
empty(prop("Unit")) ? if(day(prop("Date")) + day(prop("Date")) == 0, if(0 != day(prop("Edited")), format(day(prop("Edited"))), "*"), format(day(prop("Date")))) : if(prop("Unit") == "day", "*/" + format(if(empty(prop("Recurring")), 1, prop("Recurring"))), if(prop("Unit") != "minute" or prop("Unit") != "hour", if(prop("Unit") == "week", format(prop("Recurring") * 7), if(prop("Unit") == "month", format(day(prop("Date"))), if(prop("Unit") == "year", format(month(prop("Date"))), "*"))), "_"))
```
- _month :
```
empty(prop("Unit")) ? if(month(prop("Date")) + month(prop("Date")) == 0, format(month(prop("Edited"))), format(month(prop("Date")))) : if(prop("Unit") == "month", "*/" + format(if(empty(prop("Recurring")), 1, prop("Recurring"))), if(prop("Unit") == "year", format(month(prop("Date"))), "*"))
```


- _week :
```
(prop("Unit") == "week") ? format(day(prop("Date"))) : "*"
```


- Cron Time : 
```
prop("_minute") + " " + prop("_hour") + " " + prop("_day") + " " + prop("_month") + " " + prop("_week")
```


## Run Script on schedule
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




