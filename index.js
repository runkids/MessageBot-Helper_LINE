const cheerio = require('cheerio');
const async = require('async');
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const { parseDateAndMsg, isNow, parseDate } = require('./util/dateUtil.js');
const { getTopPages, getPosts, getImages } = require('./util/parsePPTBeauty.js');
const switchAndDoSometing = require('./util/switchAndDoSometing.js');
const { LineClient} = require('messaging-api-line');
const configs = require('./config/config.js');
const GoogleSpreadsheet = require('google-spreadsheet');
const creds = require('./config/client_secret.json');
const schedule = require('node-schedule');
const { CHANNEL_ACCESS_TOKEN, CHANNEL_SERECT, CHANNEL_ID, GROUP_ID, TEST_ID, PICURL, GOOGLESPREADSHEET_ID } = require('./config/config.js');
global.images=[];

let app = express(),
    port = process.env.PORT || 80,
    $line = LineClient.connect(CHANNEL_ACCESS_TOKEN, CHANNEL_SERECT),//載入LINE的資訊 
    doc = new GoogleSpreadsheet(GOOGLESPREADSHEET_ID), //使用 https://github.com/theoephraim/node-google-spreadsheet#api
    switchVal = true; //開啟/關閉 年剩餘日倒數功能
saveImages();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(port, () => console.log(`listening on port ${port} and images length:${images.length}`));

app.post('/callback', (req, res) => {
    let { message, source, timestamp } = req.body.events[0],
        eventType = message.type,
        eventText = message.text;
        configs.eventUserId = source.userId;
        configs.eventGroupId = source.groupId;
        configs.eventTimestamp = timestamp;

    if (eventType == 'text') {
        doc.useServiceAccountAuth(creds, (err) => { //塞資料到GOOGLE DOC  https://docs.google.com/spreadsheets/d/1eFBMeOIuMPGZ_U0-0qd4tQ_pcIg40Db7VMeYSp5LrpA/edit#gid=0
            let { sentTo, msg, event, powerSwitch } = switchAndDoSometing(configs, eventText);

            if(eventText === '抽表特'){
                let imageUrl = images[getRandomInt(0,images.length)];
                $line.pushImage( source.groupId ? source.groupId : source.userId ,imageUrl,imageUrl);
                return;
            }

            if (eventText === '/showEvent' || eventText === '/showEventCount') { //另外處理，不寫在 switchAndDoSometing，因為要撈資料
                doc.getRows(1, function (err, rows) {
                    let msg = "", dataTo,
                        sentTo = source.groupId ? source.groupId : source.userId,
                        count = 0;
                    rows.map((val, index, array) => {
                        let date = parseDateAndMsg(val.date + ";")
                        dataTo = val.groupid ? val.groupid : val.userid
                        if (dataTo == sentTo) { //只能撈該群組的資料
                            msg = msg + `資料編號:${index + 2} . ${date.month}月${date.day}日${date.hour}點${date.min}分 , ${val.message} \n`;
                            count++;
                        }
                    });
                    if (eventText === '/showEventCount') {
                        msg = count != 0 ? `${source.groupId ? '此群組' : '您'}目前有 ${count} 個待辦提醒事件` : '目前沒有待辦提醒事項'
                    }
                    $line.pushText(sentTo, msg == "" ? "目前沒有待辦提醒事項" : msg);
                    return;
                });
            }

            if (sentTo !== undefined) {
                if (event !== undefined) {
                    doc.addRow(1,
                        {
                            date: "'" + event.info.split(';')[0],
                            message: event.info.split(';')[1],
                            userId: event.userId,
                            groupId: event.groupId,
                            timestamp: "'" + event.timestamp
                        },
                        (err) => {
                            if (err) {
                                console.log(err);
                            }
                        }
                    );
                }
                if (powerSwitch !== undefined) {
                    switchVal = powerSwitch;
                }
                $line.pushText(sentTo, msg);
            }
        });
    }
});

//排程
setInterval(() => {
    doc.useServiceAccountAuth(creds, (err) => {
        doc.getRows(1, (err, rows) => {
            if (rows.length) { //回報排程事件
                rows.map((val, index, array) => {
                    let event = parseDateAndMsg(val.date + ';' + val.message);
                    if (isNow(event, "0")) {
                        $line.getUserProfile(val.userid).then(profile => {
                            $line.pushText(val.groupid ? val.groupid : val.userid, "提醒 !  " + val.message + '\n此訊息由 @' + profile.displayName + ' 於 ' + parseDate(+val.timestamp) + ' 新增');
                        });
                        rows[index].del();
                        console.log("已刪除訊息:", new Date());
                    }
                });
            }
        });
    });
}, 1000);


schedule.scheduleJob({ hour: 0, minute: 0 }, () => { //每日凌晨00:00執行
    let defDate = isNow(parseDateAndMsg('00000000;null'), "1");
    if(defDate){
        saveImages();
    }
    if (defDate && switchVal) {  //每天報今年剩餘日期
        $line.pushCarouselTemplate(
            GROUP_ID, //傳送給此ID
            defDate.msg1,
            [{
                thumbnailImageUrl: PICURL,
                title: 'GO!',
                text: defDate.msg1,
                actions: [
                    {
                        type: 'postback',
                        label: defDate.msg2,
                        data: ' ',
                    }
                ]
            }]
        );
    }
});

function saveImages(){
    images.length=0;
    getTopPages((pages) => {
        async.map(pages, (page, callback) => {
            getPosts(page, (posts) => {
            callback(null, posts)
            })
        }, (err, results) => {
            var posts = [].concat.apply([], results)
            async.map(posts, (post, callback) => {
            getImages(post, (images) => {
                callback(null, images)
            })
            }, (err, results) => {
            [].concat.apply([], results).map((image)=>{
                images.push('https://' + image + '.jpg');
                console.log(image);
            })
            })
        })
    })
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; 
  }