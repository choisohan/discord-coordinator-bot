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
- [ ] Tweet with Image