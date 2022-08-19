var moment = require("moment");

const calculateDuration = (details) => {
  const dateSpans = details.dates || [
    {
      startDate: details.startDate,
      endDate: details.endDate,
    },
  ];

  return dateSpans.reduce(
    (dur, { startDate, endDate }) =>
      dur.add(moment.duration(moment(endDate).diff(moment(startDate)))),
    moment.duration(0)
  );
};
module.exports = { calculateDuration };
