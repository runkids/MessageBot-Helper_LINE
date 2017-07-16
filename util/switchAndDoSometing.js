switchAndDoSometing = ({ TEST_ID, GROUP_ID, eventUserId, eventGroupId, eventTimestamp }, text) => {
    let eventObj = {},
        sender = eventGroupId ? eventGroupId : eventUserId;

    if (text === '/help') {
        eventObj.sentTo = sender;
        eventObj.msg = '===指令如下===\n' +
            '1. 顯示目前已有的提醒事件數量 => /showEventCount \n\n' +
            '2. 顯示目前已有的提醒事件清單 => /showEvent \n\n' +
            '3. 開啟/關閉 年剩餘日倒數功能 => /switch:on 開啟 ... /switch:off 關閉 \n\n' +
            '4. 新增提醒事件 => +event:MMddHHmmss;yor want to do someting\n' + 'ex. +event:07141800;買晚飯順便倒垃圾!';

    }

    if (text.split(':') != undefined && text.split(':')[0] === '/switch') {
        let powerSwitch = text.split(':')[1];
        eventObj.sentTo = sender;
        eventObj.powerSwitch = powerSwitch === 'on' ? true : false;
        eventObj.msg = '年剩餘日倒數功能已' + (powerSwitch === 'on' ? '開啟' : '關閉');
    }

    if (text.split(':') != undefined && text.split(':')[0] === '+event') {
        let reID = /^[0-9]{8}$/;
        eventObj.sentTo = sender;
        if (!reID.test(text.split(':')[1].split(';')[0])) {
            eventObj.msg = '日期格式有誤!MMddHHmm';
        } else {
            eventObj.event = {};
            eventObj.event.info = text.split(':')[1];
            eventObj.msg = '新增提醒事件完成!';
            eventObj.event.userId = eventUserId;
            eventObj.event.groupId = eventGroupId;
            eventObj.event.timestamp = eventTimestamp;
        }
    }
    return eventObj;
};


module.exports = switchAndDoSometing;