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
    this.append(listOfElems);
    return this;
  };
  return elem;
};

//Рендер обоины календаря
const calendarWallpaper = (start, end) => {
  gElem("#calendar_wallpaper").clear();
  for (i = start * 60; i <= end * 60; i += 30) {
    const block = !(i % 60) ? cElem("div", "hour") : cElem("div", "half_hour");
    let time = i / 60 >= 13 ? i / 60 - 12 : i / 60;
    time = time < 10 ? "0" + Math.floor(time) : Math.floor(time);
    const blockLabel = !(i % 60)
      ? cElem("span", "hour_label", `${time}:00`)
      : cElem("span", "half_hour_label", `${time}:30`);
    block.append(blockLabel);
    gElem("#calendar_wallpaper").add(block);
  }
};

activitiesTemplate = [
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

//Создаем наше расписание
class TimeTable {
  constructor(arrOfActivities, start = 8, end = 17) {
    //Проверяем на конфиг в кэше и создаем
    if (!localStorage.config) {
      this.config = { dayStart: start, dayEnd: end };
    } else {
      this.config = JSON.parse(localStorage.config);
    }

    //Проверяем на наличие событий в кэше и создаем
    if (!localStorage.activities) {
      this.activities = [];
      arrOfActivities.forEach((activity) => {
        const newActivity = {};
        newActivity.title = activity.title;
        newActivity.start = activity.start + this.config.dayStart * 60;
        newActivity.duration = activity.duration;
        newActivity.end = activity.duration + newActivity.start;
        newActivity.color = "rgba(110, 158, 207, 1)";
        newActivity.id = this.activities.length + 1;
        this.activities.push(newActivity);
      });
    } else {
      this.activities = JSON.parse(localStorage.activities);
    }
  }

  // Добавляем новое событие
  setActivity(title, start, end, color, id) {
    if (end <= start) {
      alert("Input end of the activity value after the start!!!");
      return false;
    } else if (start < this.config.dayStart * 60) {
      alert("Input start of the activity value after the start of the day!!!");
      return false;
    } else if (start > this.config.dayEnd * 60) {
      alert("Input start of the activity value before the end of the day!!!");
      return false;
    } else if (end > this.config.dayEnd * 60) {
      alert("Input end of the activity value before the end of the day!!!");
      return false;
    } else if (end < this.config.dayStart * 60) {
      alert("Input end of the activity value after the start of the day!!!");
      return false;
    } else if (!title || !start || !end) {
      alert("Input all nedeed values!!!");
      return false;
    } else if (this.activities.filter((e) => e.start === start).length && !id) {
      alert("Already have an activity at this time!!!");
      return false;
    }

    const activity = {
      title: title,
      start: start,
      duration: end - start,
      end: end,
      color: color,
      id: id || this.activities.length + 1,
    };

    if (this.activities.filter((e) => e.id === activity.id).length) {
      this.activities.forEach((item, index, arr) => {
        if (item.id === activity.id) {
          arr.splice(index, 1);
        }
      });
    }
    this.activities.push(activity);

    renderActivity(this);

    localStorage.activities = JSON.stringify(this.activities);
    return "success";
  }

  changeDaydayLongevity(start = 8, end = 17) {
    if (start < this.config.dayEnd) {
      this.config.dayStart = start;
    } else {
      alert("Input start of the day value before end!!!");
      return false;
    }
    if (end > this.config.dayStart) {
      this.config.dayEnd = end;
    } else {
      alert("Input end of the day value after start!!!");
      return false;
    }
    renderActivity(this);

    localStorage.config = JSON.stringify(this.config);
    localStorage.activities = JSON.stringify(this.activities);
  }
}

const renderActivity = (scheduleForRender) => {
  calendarWallpaper(
    scheduleForRender.config.dayStart,
    scheduleForRender.config.dayEnd
  );
  gElem("#activities_container").clear();
  activitiesForRender = [...scheduleForRender.activities].sort((a1, a2) => {
    return a1.start - a2.start;
  });
  for (let activity of activitiesForRender) {
    activity.column = !activity.column ? 0 : activity.column;

    for (let activityForCompare of activitiesForRender) {
      if (
        // раннее событие пересекается с текущим
        activity.start > activityForCompare.start &&
        activity.start < activityForCompare.end
      ) {
        activity.column =
          activity.column === activityForCompare.column ? 3 : activity.column;
      } else if (
        // позднее событие пересекается с текущим
        activity.start < activityForCompare.start &&
        activityForCompare.start < activity.end
      ) {
        activity.column =
          activity.column === 3 || activity.column === 2 ? activity.column : 1;
        activityForCompare.column = activity.column === 2 ? 1 : 2;
      }
    }
    //Создаем див нашего события со свойствами и стилями
    const activityBlock = cElem("div", "activity", activity.title);
    if (activity.column === 0) {
      activityBlock.style.width = "200px";
      activityBlock.style.left = "50px";
    } else if (activity.column === 1) {
      activityBlock.style.width = "100px";
      activityBlock.style.left = "50px";
    } else if (activity.column === 2) {
      activityBlock.style.width = "100px";
      activityBlock.style.left = "150px";
    } else if (activity.column === 3) {
      activityBlock.style.width = "100px";
      activityBlock.style.left = "250px";
    }
    activityBlock.style.top = `${
      (activity.start - scheduleForRender.config.dayStart * 60) * 2
    }px`;
    activityBlock.style.height = `${activity.duration * 2}px`;
    activityBlock.style.borderLeft = `3px solid ${activity.color}`;
    const backgroundColor = activity.color.split(" ");
    backgroundColor.splice(3, 1, "0.2)");
    activityBlock.style.background = backgroundColor.join(" ");
    activityBlock.id = `activity_${activity.id}`;
    gElem("#activities_container").add(activityBlock);
  }
};

//Запускаем приложение
let schedule = new TimeTable([...activitiesTemplate]);
renderActivity(schedule);

//Заполнение полей времени дня
window.addEventListener("DOMContentLoaded", () => {
  gElem("#day_longevity").dayStart.value = `${
    schedule.config.dayStart < 10
      ? "0" + schedule.config.dayStart
      : schedule.config.dayStart
  }:00`;
  gElem("#day_longevity").dayEnd.value = `${
    schedule.config.dayEnd < 10
      ? "0" + schedule.config.dayEnd
      : schedule.config.dayEnd
  }:00`;
});

//Изменение продолжительности дня
gElem("#day_longevity").addEventListener("submit", (e) => {
  e.preventDefault();
  schedule.changeDaydayLongevity(
    e.target.dayStart.valueAsNumber / 1000 / 60 / 60,
    e.target.dayEnd.valueAsNumber / 1000 / 60 / 60
  );
});
gElem("#day_longevity").addEventListener("reset", (e) => {
  e.preventDefault();
  schedule.changeDaydayLongevity();
  localStorage.removeItem("config");
  gElem("#day_longevity").dayStart.value = `${
    schedule.config.dayStart < 10
      ? "0" + schedule.config.dayStart
      : schedule.config.dayStart
  }:00`;
  gElem("#day_longevity").dayEnd.value = `${
    schedule.config.dayEnd < 10
      ? "0" + schedule.config.dayEnd
      : schedule.config.dayEnd
  }:00`;
});

//Демонтсрация/скрытие панели редактирования времени дня
gElem("#show").addEventListener("click", (e) => {
  e.preventDefault();
  if (e.target.value === "false") {
    e.target.value = "true";
    gElem("#changing_day").style.display = "initial";
  } else {
    e.target.value = "false";
    gElem("#changing_day").style.display = "none";
  }
});

//Колесо выбора цвета события
const colorWheel = new iro.ColorPicker("#colorWheel", {
  layout: [
    {
      component: iro.ui.Wheel,
      options: {
        wheelLightness: true,
        wheelAngle: 0,
        wheelDirection: "anticlockwise",
      },
    },
    {
      component: iro.ui.Slider,
      options: { sliderType: "value" },
    },
  ],
  color: "rgba(110, 158, 207, 1)",
  handleRadius: 15,
  width: 0,
  display: "block",
});

//Открываем панель с добавлением нового события
gElem("#btn_add").addEventListener("click", (e) => {
  e.preventDefault();
  if (e.target.value === "false") {
    gElem("#activity_parameters").style.display = "flex";
    e.target.value = "true";
  } else {
    gElem("#activity_parameters").style.display = "none";
    e.target.value = "false";
  }
});

// schedule.addActivity("tmplate", 16 * 60, 40);

//Работаем с цветом на окошке нового события
gElem("#color_picker").addEventListener("click", (e) => {
  e.preventDefault();
  if (!e.target.value || e.target.value === "disabled") {
    colorWheel.resize(240);
    gElem("#activity_parameters_main").style.height = "300px";
    gElem("#colorWheel").style.height = "200px";
    e.target.value = "enabled";
  } else {
    e.target.value = "disabled";
    colorWheel.resize(0);
    gElem("#activity_parameters_main").style.height = "0";
    gElem("#colorWheel").style.height = "0";
  }
});

colorWheel.on("input:change", function (color) {
  gElem("#color_picker").style.backgroundColor = color.rgbaString;
});
colorWheel.on("color:init", function (color) {
  gElem("#color_picker").style.backgroundColor = color.rgbaString;
});

//Добавляем новое событие
gElem("#add_activity").addEventListener("submit", (e) => {
  e.preventDefault();
  if (
    schedule.setActivity(
      e.target.activity_title.value,
      e.target.activityStart.valueAsNumber / 1000 / 60,
      e.target.activityEnd.valueAsNumber / 1000 / 60,
      colorWheel.color.rgbaString
    ) === "success"
  ) {
    gElem("#activity_parameters").style.display = "none";
    gElem("#btn_add").value = "false";
  }
});
gElem("#add_activity").addEventListener("reset", (e) => {
  e.preventDefault();
  gElem("#add_activity").activity_title.value = "";
  gElem("#add_activity").activityStart.value = "";
  gElem("#add_activity").activityEnd.value = "";
  colorWheel.reset();
  gElem("#color_picker").style.backgroundColor = colorWheel.color.rgbaString;
});

//Очищаем локал сторадж событий
gElem("#btn_clear").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("activities");
  gElem("#add_activity").activity_title.value = "";
  gElem("#add_activity").activityStart.value = "";
  gElem("#add_activity").activityEnd.value = "";
  colorWheel.reset();
  gElem("#color_picker").style.backgroundColor = colorWheel.color.rgbaString;

  schedule = "";
  schedule.activities;
  schedule = new TimeTable([...activitiesTemplate]);
  renderActivity(schedule);
});

// schedule.setActivity("sfsf", 580, 595, "rgba(10, 158, 207, 1)", 5);
