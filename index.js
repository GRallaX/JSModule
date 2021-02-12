const cElem = (tagName, className, text) => {
  const elem = document.createElement(tagName);
  elem.className = className || "";
  elem.innerHTML = text || "";
  return elem;
};

const gElem = (param) => {
  const elem = document.querySelector(param);
  elem.clear = function () {
    this.innerHTML = "";
    return this;
  };
  elem.add = function (listOfElems) {
    this.append(...listOfElems);
    return this;
  };
  return elem;
};

const calendarWrapper = gElem("#calendar_wrapper");

const calendarWallpaper = (start, end) => {
  for (i = start * 60; i <= end * 60; i += 30) {
    const block = !(i % 60) ? cElem("div", "hour") : cElem("div", "half_hour");
    let time = i / 60 >= 13 ? i / 60 - 12 : i / 60;
    time = time < 10 ? "0" + Math.floor(time) : Math.floor(time);
    const blockLabel = !(i % 60)
      ? cElem("span", "hour_label", `${time}:00`)
      : cElem("span", "half_hour_label", `${time}:30`);
    block.append(blockLabel);
    calendarWrapper.append(block);
  }
};

calendarWallpaper(8, 17);

class TimeTable {
  constructor() {
    this.activities = [
      { start: 0, duration: 15, title: "Exercise" },
      { start: 25, duration: 30, title: "Travel to work" },
      { start: 30, duration: 30, title: "Scheduling the day" },
      { start: 60, duration: 15, title: "Reviewing yesterday's commits" },
      { start: 100, duration: 15, title: "Code review" },
      { start: 180, duration: 90, title: "Lunch with John" },
      { start: 360, duration: 30, title: "Skype call" },
      { start: 370, duration: 45, title: "Follow up with designer" },
      { start: 405, duration: 30, title: "Push up branch" },
    ];
  }
  setActivity(start, duration, title, id = 1) {
    this.activities.push({
      id: id++,
      start: start,
      duration: duration,
      title: title,
    });
  }
}
const renderActivity = (activities) => {
  let i = 1;
  for (let activity of activities) {
    const end = (item) => item.duration + item.start;
    activity.width = "200px";
    activity.left = "100px";
    for (let activityForCompare of activities) {
      if (
        activity.start < activityForCompare.start &&
        activityForCompare.start < end(activity)
      ) {
        activity.width = "100px";
      } else if (
        activity.start > activityForCompare.start &&
        activity.start < end(activityForCompare)
      ) {
        activity.width = "100px";
        activity.left = activityForCompare.left === "100px" ? "200px" : "100px";
      }
    }
    const activityBlock = cElem("div", "activity", activity.title);
    activityBlock.style.height = `${activity.duration * 2}px`;
    activityBlock.style.width = activity.width;
    activityBlock.style.top = `${activity.start * 2}px`;
    activityBlock.style.left = activity.left;
    activityBlock.id = activity.id || i++;
    calendarWrapper.append(activityBlock);
  }
};

const schedule = new TimeTable();
renderActivity(schedule.activities);
