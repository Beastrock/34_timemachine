let TIMEOUT_IN_SECS = 60 * 3;
let ALERT_INTERVAL_IN_SECS = 30;
let TEMPLATE = '<div id="digits"><span class="js-timer-minutes ">00</span>' +
  ':<span class="js-timer-seconds">00</span><div>';

function padZero(number) {
  return ("00" + String(number)).slice(-2);
}

function getRandomMotivatingQuote() {
  let quotes = [
    "Делайт это сейчас. Будущее никому не обещано.",
    "Лучше время посадить дерево — 20 лет назад. Второе лучшее время — СЕЙЧАС.",
    "Если не сейчас, то когда? Если не ты, то кто?",
    "Нет такого дня недели «когда-нибудь».",
    "Вася? Ты совсем шоль? Дедлайн же!",
    "Если ты не создашь свой собственный жизненный план,то скорее всего ты попадёшь в " +
    "чей-то чужой.\n И как ты думаешь,сколько там будет запланировано для тебя? Немного."
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function createStyleTagForBlinkingClassAndDigitsFont() {
  let cssBlinkerDigitsAnimation = ".blinker { animation: blinker 1s linear infinite; }" +
    " @keyframes blinker { 50% { opacity: 0; }}";
  let cssFontForDigits = "@import url('https://fonts.googleapis.com/css?family=Share+Tech+Mono');";
  let css = cssFontForDigits + " " + cssBlinkerDigitsAnimation;
  let head = document.head || document.getElementsByTagName("head")[0];
  let style = document.createElement("style");

  style.type = "text/css";
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
}


class Timer {
  // IE does not support new style classes yet
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
  constructor(timeout_in_secs) {
    this.isRunning = false;
    this.timestampOnStart = null;
    this.initial_timeout_in_secs = timeout_in_secs;
    this.timeout_in_secs = this.initial_timeout_in_secs;
  }

  getTimestampInSecs() {
    let timestampInMilliseconds = new Date().getTime();
    return Math.round(timestampInMilliseconds / 1000)
  }

  start() {
    if (this.isRunning)
      return;
    this.timestampOnStart = this.getTimestampInSecs();
    this.isRunning = true
  }

  stop() {
    if (!this.isRunning)
      return;
    this.timeout_in_secs = this.calculateSecsLeft();
    this.timestampOnStart = null;
    this.isRunning = false
  }

  calculateSecsLeft() {
    if (!this.isRunning)
      return this.timeout_in_secs;
    let currentTimestamp = this.getTimestampInSecs();
    let secsGone = currentTimestamp - this.timestampOnStart;
    return Math.max(this.timeout_in_secs - secsGone, 0)
  }

  timeIsOut() {
    return this.calculateSecsLeft() === 0
  }
}

class TimerWidget {
  // IE does not support new style classes yet
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
  constructor() {
    this.blinkCssClass = "blinker";
    this.isInAlertingMode = false;
    this.timerContainer = this.minutes_element = this.seconds_element = null
  }

  mount(rootTag) {
    if (this.timerContainer)
      this.unmount();

    // adds HTML timer div to current page
    this.timerContainer = document.createElement("div");
    let styleForTimeContainer = "font-family: 'Share Tech Mono', monospace;" +
      "box-shadow: 0 5px 3px -3px black; font-family: 'Share Tech Mono', monospace; " +
      "display: inline-block; border: 5px double #bd8282; border-radius: 10px; " +
      "background-color: brown; position: fixed; left: 3px; top: 40px; z-index: 10;";
    this.timerContainer.setAttribute("style", styleForTimeContainer);

    this.timerContainer.innerHTML = TEMPLATE;
    rootTag.insertBefore(this.timerContainer, rootTag.firstChild);

    let styleForDigitsContainer = "padding: 3px 4px; display: inline-block; border-radius: 10px;" +
      "background-color: #23221d; color: white; font-size: 25px;";
    this.digitsContainer = document.getElementById("digits");
    this.digitsContainer.setAttribute("style", styleForDigitsContainer);

    this.minutes_element = this.timerContainer.getElementsByClassName("js-timer-minutes")[0];
    this.seconds_element = this.timerContainer.getElementsByClassName("js-timer-seconds")[0];
  }

  update(secsLeft) {
    let timeIsOut = (secsLeft === 0);
    let minutes = Math.floor(secsLeft / 60);
    let seconds = secsLeft - minutes * 60;

    this.minutes_element.innerHTML = padZero(minutes);
    this.seconds_element.innerHTML = padZero(seconds);

    if (timeIsOut && !this.isInAlertingMode) {
      this.minutes_element.setAttribute("class", this.blinkCssClass);
      this.seconds_element.setAttribute("class", this.blinkCssClass);
    }
  }

  unmount() {
    if (!this.timerContainer)
      return;
    this.timerContainer.remove();
    this.timerContainer = this.minutes_element = this.seconds_element = null
  }
}


function main() {
  let mainTimer = new Timer(TIMEOUT_IN_SECS);
  let alertTimer = new Timer(ALERT_INTERVAL_IN_SECS);
  let timerWidget = new TimerWidget();
  let tickIntervalId, timeOutIntervalId;
  tickIntervalId = timeOutIntervalId = null;

  createStyleTagForBlinkingClassAndDigitsFont();

  timerWidget.mount(document.body);

  function handleIntervalTick() {
    let secsLeft = mainTimer.calculateSecsLeft();
    timerWidget.update(secsLeft)
  }

  function handleAlerts() {
    // Function checks when main timer is out of time,
    // then starts alert timer and after it ends throws the alert.

    if (mainTimer.timeIsOut()) {
      alertTimer.start();
    }

    if (alertTimer.timeIsOut()) {
      alert(getRandomMotivatingQuote());
      alertTimer = new Timer(ALERT_INTERVAL_IN_SECS)
    }
  }


  function handleVisibilityChange() {
    if (document.hidden) {

      alertTimer.stop();
      mainTimer.stop();

      clearInterval(timeOutIntervalId);
      clearInterval(tickIntervalId);
      tickIntervalId = timeOutIntervalId = null

    } else {

      mainTimer.start();

      if (mainTimer.timeIsOut()) {
        alertTimer.start()
      }

      tickIntervalId = tickIntervalId || setInterval(handleIntervalTick, 300);
      timeOutIntervalId = timeOutIntervalId || setInterval(handleAlerts, 300);
    }
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
  document.addEventListener("visibilitychange", handleVisibilityChange, false);
  handleVisibilityChange();
}

// initialize timer when page ready for presentation
window.addEventListener("load", main);