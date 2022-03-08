# ⭐ Summary
This is the little discord bot project created by [Min Shin](instagram.com/happping_min). The goal is creating the coordinator bot which manage the notion database and extra more. Development is still going on. 


# ⭐ Features
1. Communite with a user's natural language message
2. Read and Create, Modify notion Database
3. Recurring tasks & reminder management based on notion database
4. Answer the user's question based on user's dictionary page or google search
5. Send a long article into a chat message.
6. react message with GIF and emoji

# ⭐Configuration
## 1. Required Env Var
BOT_TOKEN (discord) , NOTION_TOKEN , NOTION_DB_ID , WIT_TOKEN, TIMEZONE 

## 2. Wit Ai Project
[wit.ai](wit.ai)
- [ ]

# ⭐Guide to write on notion

## Quick Start
1. Get Database's ID and assign it on env variable
2. Properties of Database
    - Group : single select, option: Log, Reminder, Task, Project, Dictionary
    - Recurring : number
    - Completed : checkbox
    - Tags: multiple select
    - Unit : single select, option : minute, hour, week, day, month, year
    - Date : date
    - _minute: formula
    - _hour:formula
    - _day: formula
    - _month: formula
    - _week : formula
    - Cron Time: formula

### Formula for Clon Time
![](/src/cron.JPG =250x)

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


### Custom Message and event for reminder
- Each block of the page will be randomly delivered each time.
- if there is the callout block on the page, it will be recognized as a code block(which is not supported in notion API yet). so create the code block and write any javascript. this will fired when cron job is fired. While you can write anything on the block but except "", ''. Don't use them, **you must use backtick ` instead**.

![](/src/callout.JPG)

