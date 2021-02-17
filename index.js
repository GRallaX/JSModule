const cElem = (tagName, className, text) => {
  const elem = document.createElement(tagName);
  elem.className = className || "";
  elem.innerHTML = text || "";
  return elem;
};

const gElem = (param) => {
  let elem = "";
  if (param.substr(0, 1) === ".") {
    elem = document.querySelectorAll(param);
  } else {
    elem = document.querySelector(param);
  }
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
        newActivity.start = activity.start + 8 * 60;
        newActivity.duration = activity.duration;
        newActivity.end = activity.duration + newActivity.start;
        newActivity.color = "rgba(110, 158, 207, 1)";
        newActivity.id = this.activities.length + 1;
        newActivity.timer = false;
        this.activities.push(newActivity);
      });
    } else {
      this.activities = JSON.parse(localStorage.activities);
    }
  }

  // Добавляем/изменяем событие
  setActivity(title, start, end, color, id, timer) {
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
    }

    const activity = {
      title: title,
      start: start,
      duration: end - start,
      end: end,
      color: color,
      id: id || this.activities.length + 1,
      timer: timer || false,
    };

    if (this.activities.filter((e) => e.id === activity.id).length) {
      this.activities.forEach((item, index, arr) => {
        if (item.id === activity.id) {
          arr.splice(index, 1);
        }
      });
    }
    this.activities.push(activity);
    localStorage.activities = JSON.stringify(this.activities);

    renderActivity(this);
    addClickOnAct();

    return "success";
  }
  //Метод изменения продолжительности дня
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

    localStorage.config = JSON.stringify(this.config);
    localStorage.activities = JSON.stringify(this.activities);
    renderActivity(this);
    addClickOnAct();
  }
}

//Функция отрисовки событий
const renderActivity = (scheduleForRender) => {
  calendarWallpaper(
    scheduleForRender.config.dayStart,
    scheduleForRender.config.dayEnd
  );
  gElem("#activities_container").clear();
  activitiesForRender = [...scheduleForRender.activities].sort((a1, a2) => {
    return a1.start - a2.start;
  });
  activitiesForRender.forEach((item) => (item.column = 0));

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
      } else if (
        activityForCompare.start === activity.start &&
        activity.id !== activityForCompare.id
      ) {
        activity.column = activity.column === 0 ? 1 : activity.column;
        activityForCompare.column =
          activity.column === 1 ? 2 : activityForCompare.column;
        activity.column =
          activity.column === 2 && activityForCompare.column === 2
            ? 3
            : activity.column;
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
    activityBlock.style.borderTop = `3px solid ${activity.color}`;
    const backgroundColor = activity.color.split(" ");
    backgroundColor.splice(3, 1, "0.2)");
    activityBlock.style.background = backgroundColor.join(" ");
    activityBlock.id = `activity_${activity.id}`;

    //Проверка на наличие таймера и его создание при необхомости

    //Функция рендеринга уведомления
    const timeNow =
      new Date().getHours() * 60 * 60 +
      new Date().getMinutes() * 60 +
      new Date().getSeconds();

    const setNotific = (
      title = activity.title,
      start = activity.start,
      end = activity.end
    ) => {
      console.log(
        "Timer func works",
        +new Date().getHours() + " : " + new Date().getMinutes()
      );
      console.log("Activity: " + title);
      activity.timer = false;
      localStorage.activities = JSON.stringify(scheduleForRender.activities);

      let notifWindowClass = "notification_1";
      if (gElem(".notification_1").length && !gElem(".notification_2").length) {
        notifWindowClass = "notification_2";
      } else if (gElem(".notification_2").length) {
        notifWindowClass = "notification_3";
      }

      //СОздаем наше уведомление
      const notifContainer = cElem("div", notifWindowClass);
      const notifTitle = cElem("h3", "", title);
      const p = cElem("p", "", "has started");
      const notifStart = cElem("input");
      const notifEnd = cElem("input");
      notifStart.setAttribute("type", "time");
      notifEnd.setAttribute("type", "time");
      notifStart.disabled = true;
      notifEnd.disabled = true;
      notifStart.valueAsNumber = start * 60 * 1000;
      notifEnd.valueAsNumber = end * 60 * 1000;
      notifContainer.append(notifTitle, p, notifStart, " — ", notifEnd);
      setTimeout(() => {
        notifContainer.remove();
      }, (end * 60 - timeNow) * 1000);
      backgroundColor.splice(3, 1, "0.85)");
      notifContainer.style.background = backgroundColor.join(" ");
      notifContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
      gElem("#activities_container").add(notifContainer);
    };

    //Функция запуска рендеринга уведомления с таймером и переменной с ID таймаута
    let timeoutID;
    const notifEnabler = () => {
      timeoutID = setTimeout(
        setNotific,
        (activity.start * 60 - timeNow) * 1000
      );
    };

    //Работаем с конфигом таймера в объекте
    if (activity.end * 60 > timeNow) {
      if (!activity.timer) {
        notifEnabler();
        activity.timer = timeoutID;
        console.log("Timer enabled", "TimerID: " + timeoutID);
      } else {
        clearTimeout(activity.timer);
        notifEnabler();
        activity.timer = timeoutID;
        console.log("Timer enabled", "TimerID: " + timeoutID);
      }
    } else {
      if (activity.timer) {
        clearTimeout(activity.timer);
        console.log("Timer disabled", "TimerID: " + activity.timer);
        activity.timer = false;
        localStorage.activities = JSON.stringify(scheduleForRender.activities);
      }
    }

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
  gElem("#show").value = "false";
  gElem("#changing_day").style.display = "none";
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
  gElem("#show").value = "false";
  gElem("#changing_day").style.display = "none";
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
const openElemParams = () => {
  gElem("#activity_parameters").style.display = "flex";
  gElem("#btn_add").value = "true";
};
const closeElemParams = () => {
  gElem("#activity_parameters").style.display = "none";
  gElem("#btn_add").value = "false";
};

gElem("#btn_add").addEventListener("click", (e) => {
  e.preventDefault();
  if (e.target.value === "false") {
    openElemParams();
  } else {
    closeElemParams();
  }
});

//Работаем с цветом на окошке нового события
gElem("#color_picker").addEventListener("click", (e) => {
  e.preventDefault();
  if (!e.target.value || e.target.value === "disabled") {
    gElem("#activity_parameters_main").style.height = "300px";
    gElem("#colorWheel").style.height = "200px";
    colorWheel.resize(240);
    e.target.value = "enabled";
    const modalBackgr = cElem("div", "modalBckgr");
    modalBackgr.addEventListener(
      "click",
      (clickToClose = (e) => {
        gElem("#color_picker").value = "disabled";
        colorWheel.resize(0);
        gElem("#activity_parameters_main").style.height = "unset";
        gElem("#colorWheel").style.height = "0";
        e.target.parentNode.removeChild(e.target);
      })
    );
    gElem("header").add(modalBackgr);
  } else {
    gElem(".modalBckgr").forEach((item) => item.parentNode.removeChild(item));
    e.target.value = "disabled";
    colorWheel.resize(0);
    gElem("#colorWheel").style.height = "0";
    gElem("#activity_parameters_main").style.height = "unset";
  }
});

colorWheel.on("input:change", function (color) {
  gElem("#color_picker").style.backgroundColor = color.rgbaString;
});
colorWheel.on("color:init", function (color) {
  gElem("#color_picker").style.backgroundColor = color.rgbaString;
});

//Очищаем поля формы
const clearParams = () => {
  gElem("#add_activity").activity_title.value = "";
  gElem("#add_activity").activityStart.value = "";
  gElem("#add_activity").activityEnd.value = "";
  colorWheel.reset();
  gElem("#color_picker").style.backgroundColor = colorWheel.color.rgbaString;
};

//Добавляем новое событие
const submitNewActivity = (e) => {
  e.preventDefault();
  if (
    schedule.setActivity(
      gElem("#add_activity").activity_title.value,
      gElem("#add_activity").activityStart.valueAsNumber / 1000 / 60,
      gElem("#add_activity").activityEnd.valueAsNumber / 1000 / 60,
      colorWheel.color.rgbaString
    ) === "success"
  ) {
    closeElemParams();
    clearParams();
  }
};

const pressEnterToSubmit = (e) => {
  if (e.keyCode == 13) {
    e.preventDefault();
    e.stopImmediatePropagation();
    submitNewActivity(e);
  }
};

gElem("#add_activity").addEventListener("submit", submitNewActivity);
gElem("#add_activity").addEventListener("keypress", pressEnterToSubmit);
gElem("#add_activity").addEventListener("reset", (e) => {
  e.preventDefault();
  clearParams();
});

//Очищаем локал сторадж событий
const clearAll = (e) => {
  e.preventDefault();
  localStorage.removeItem("activities");
  clearParams();
  schedule = "";
  schedule.activities;
  schedule = new TimeTable([...activitiesTemplate]);
  renderActivity(schedule);
  addClickOnAct();
  closeElemParams();
};
const clearAllBtn = () => {
  gElem("#btn_clear").addEventListener("click", clearAll);
};
clearAllBtn();

//Изменяем уже существующее событие

const addClickOnAct = () => {
  let counterAddClick = 0;
  gElem(".activity").forEach((item) => {
    item.addEventListener("click", (e) => {
      const id = e.target.id.split("activity_").join("");
      const actArr = schedule.activities.filter((act) => act.id == id);
      const act = actArr[0];
      openElemParams();
      gElem("#add_activity").activity_title.value = act.title;
      gElem("#add_activity").activityStart.valueAsNumber =
        act.start * 60 * 1000;
      gElem("#add_activity").activityEnd.valueAsNumber = act.end * 60 * 1000;
      colorWheel.color.set(act.color);
      gElem("#color_picker").style.backgroundColor =
        colorWheel.color.rgbaString;

      // Взаимодействуем с кнопкой отправки
      if (counterAddClick) {
        gElem("#apply_act").removeEventListener("click", changeActivity);
      }
      gElem("#apply_act").innerHTML = "Change";
      gElem("#apply_act").addEventListener(
        "click",
        (changeActivity = (e) => {
          e.preventDefault();
          if (
            schedule.setActivity(
              gElem("#add_activity").activity_title.value,
              gElem("#add_activity").activityStart.valueAsNumber / 1000 / 60,
              gElem("#add_activity").activityEnd.valueAsNumber / 1000 / 60,
              colorWheel.color.rgbaString,
              act.id,
              act.timer
            ) === "success"
          ) {
            counterAddClick = 0;
            gElem("#btn_reset").removeEventListener("click", resetChangeAct);
            gElem("#btn_clear").removeEventListener("click", deleteActivity);
            gElem("#btn_clear").addEventListener("click", clearAll);
            gElem("#btn_clear").innerHTML = "Clear all";
            gElem("#add_activity").removeEventListener(
              "keypress",
              submitChangeAct
            );
            gElem("#add_activity").addEventListener(
              "keypress",
              pressEnterToSubmit
            );
            gElem("#btn_reset").innerHTML = "Reset";
            closeElemParams();
            clearParams();
            e.target.innerHTML = "Apply";
            e.target.removeEventListener("click", changeActivity);
          }
        })
      );

      //Взаимодействуем с кнопкой сброса
      gElem("#btn_reset").innerHTML = "Cancel";
      gElem("#btn_reset").addEventListener(
        "click",
        (resetChangeAct = (e) => {
          e.preventDefault();
          clearParams();
          closeElemParams();
          counterAddClick = 0;
          gElem("#apply_act").removeEventListener("click", changeActivity);
          "keypress",
            gElem("#btn_clear").removeEventListener("click", deleteActivity);
          gElem("#btn_clear").addEventListener("click", clearAll);
          gElem("#btn_clear").innerHTML = "Clear all";
          gElem("#add_activity").removeEventListener(submitChangeAct);
          gElem("#add_activity").addEventListener(
            "keypress",
            pressEnterToSubmit
          );
          e.target.removeEventListener("click", resetChangeAct);
          gElem("#apply_act").innerHTML = "Apply";
          e.target.innerHTML = "Reset";
        })
      );

      // Взаимодействуем с кнопкой ClearAll
      gElem("#btn_clear").innerHTML = "Delete";
      if (!counterAddClick) {
        gElem("#btn_clear").removeEventListener("click", clearAll);
      } else {
        gElem("#btn_clear").removeEventListener("click", deleteActivity);
      }

      gElem("#btn_clear").addEventListener(
        "click",
        (deleteActivity = (e) => {
          e.preventDefault();
          schedule.activities = schedule.activities.filter(
            (item) => item.id != id
          );
          renderActivity(schedule);
          addClickOnAct();
          closeElemParams();
          localStorage.activities = JSON.stringify(schedule.activities);
          counterAddClick = 0;
          gElem("#apply_act").removeEventListener("click", changeActivity);
          gElem("#btn_reset").removeEventListener("click", resetChangeAct);
          gElem("#apply_act").innerHTML = "Apply";
          gElem("#btn_reset").innerHTML = "Reset";
          gElem("#add_activity").removeEventListener(
            "keypress",
            submitChangeAct
          );
          gElem("#add_activity").addEventListener(
            "keypress",
            pressEnterToSubmit
          );
          e.target.innerHTML = "Clear all";
          e.target.removeEventListener("click", deleteActivity);
          e.target.addEventListener("click", clearAll);
        })
      );

      //Взаимодействуем с сабмит формы
      if (!counterAddClick) {
        gElem("#add_activity").removeEventListener(
          "keypress",
          pressEnterToSubmit
        );
        gElem("#add_activity").removeEventListener("submit", submitNewActivity);
      } else {
        gElem("#add_activity").removeEventListener("keypress", submitChangeAct);
      }
      counterAddClick++;
      gElem("#add_activity").addEventListener(
        "keypress",
        (submitChangeAct = (e) => {
          if (e.keyCode == 13) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (
              schedule.setActivity(
                gElem("#add_activity").activity_title.value,
                gElem("#add_activity").activityStart.valueAsNumber / 1000 / 60,
                gElem("#add_activity").activityEnd.valueAsNumber / 1000 / 60,
                colorWheel.color.rgbaString,
                act.id,
                act.timer
              ) === "success"
            ) {
              counterAddClick = 0;
              gElem("#apply_act").removeEventListener("click", changeActivity);
              gElem("#btn_reset").removeEventListener("click", resetChangeAct);
              gElem("#btn_clear").removeEventListener("click", deleteActivity);
              gElem("#btn_clear").addEventListener("click", clearAll);
              gElem("#btn_clear").innerHTML = "Clear all";
              gElem("#apply_act").innerHTML = "Apply";
              gElem("#btn_reset").innerHTML = "Reset";
              gElem("#add_activity").removeEventListener(
                "keypress",
                submitChangeAct
              );
              gElem("#add_activity").addEventListener(
                "keypress",
                pressEnterToSubmit
              );
              gElem("#add_activity").addEventListener(
                "submit",
                submitNewActivity
              );
              closeElemParams();
              clearParams();
            }
          }
        })
      );
    });
  });
};

addClickOnAct();

//Помогаем вводить время активности (+15мин)
gElem("#activityStart").addEventListener("change", (e) => {
  if (
    !gElem("#activityEnd").value ||
    gElem("#activityEnd").valueAsNumber <= gElem("#activityStart").valueAsNumber
  ) {
    gElem("#activityEnd").valueAsNumber =
      e.target.valueAsNumber + 15 * 60 * 1000;
  }
});
gElem("#activityEnd").addEventListener("change", (e) => {
  if (
    !gElem("#activityStart").value ||
    gElem("#activityEnd").valueAsNumber <= gElem("#activityStart").valueAsNumber
  ) {
    gElem("#activityStart").valueAsNumber =
      e.target.valueAsNumber - 15 * 60 * 1000;
  }
});
