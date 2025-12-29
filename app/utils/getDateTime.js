const moment = require('moment-timezone');

function getCurrentDateTimeInTimeZone() {
    let timeZone = 'Asia/Kolkata';
    if (!moment.tz.zone(timeZone)) {
    throw new Error('Invalid time zone');
  }

  const currentDateTime = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

  return currentDateTime;
}

module.exports = {
    getCurrentDateTimeInTimeZone
}
