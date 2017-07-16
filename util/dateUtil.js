let dateUtil = {
    parseDateAndMsg: (dateAndMsg) => {
        return {
            month: dateAndMsg.substring(0, 2),
            day: dateAndMsg.substring(2, 4),
            hour: dateAndMsg.substring(4, 6),
            min: dateAndMsg.substring(6, 8),
            msg: dateAndMsg.split(';')[1]
        };
    },

    isNow: ({ month, day, hour, min, msg }, type) => {
        let { tMonth, tDate, tHours, tMinutes, tSeconds, fullStringDate } = getFullInfo(new Date()),
            getDay = Math.ceil((new Date().getTime() - new Date(2017, 01 - 1, 01).getTime()) / (24 * 60 * 60 * 1000));

        if (type == "1") {
            return { msg1: "又過了一天囉Q口Q...\n進度條:|||||||| " + Math.floor(((365 - getDay) / 365) * 100) + "% ||||||||", msg2: "今年還剩下" + (365 - getDay) + "天!" }
        }
        //type 0 給一般排程用
        if (type == "0" && tSeconds == "00" && tMinutes == min && tHours == hour && tDate == day && tMonth == month) {
            return true;
        }

        return false;
    },

    parseDate: (timestamp) => {
        return getFullInfo(new Date(timestamp)).fullStringDate;
    },

}, getFullInfo = (date) => {
    let dateObj = {
        tMonth: (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1),
        tDate: date.getDate() > 9 ? date.getDate() : '0' + date.getDate(),
        tHours: date.getHours() > 9 ? date.getHours() : '0' + date.getHours(),
        tMinutes: date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes(),
        tSeconds: date.getSeconds() > 9 ? date.getSeconds() : '0' + date.getSeconds()
    };
    dateObj.fullStringDate = date.getFullYear() + '/' + dateObj.tMonth + '/' + dateObj.tDate + ' ' + dateObj.tHours + ':' + dateObj.tMinutes;
    return dateObj;
};

module.exports = dateUtil;
