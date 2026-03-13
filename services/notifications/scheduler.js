const cron = require("node-cron")

async function ininScheduler(when) {
    const date = new Date(when);
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;

    const time = `${minutes} ${hours} ${dayOfMonth} ${month} *`;
    cron.schedule(time, ()=>{
        //TODO: get user notification
        //TODO: parce into titile and body
        //TODO: send with notifications service
    });
}