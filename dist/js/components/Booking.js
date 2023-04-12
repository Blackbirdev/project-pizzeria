import { select, templates, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }
  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);

    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    console.log('getData params', params);

    const urls = {
      bookings: settings.db.url + '/' +
        settings.db.booking + '?' +
        params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' +
        settings.db.event + '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' +
        settings.db.event + '?' +
        params.eventsRepeat.join('&'),
    };
    console.log('urls', urls);

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }
  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
    console.log('Booked', thisBooking.booked);
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      // console.log('loop', hourBlock);

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

    for (let table of thisBooking.dom.tables) {
      if (table.classList.contains('selected')) {
        table.classList.remove('selected');
      }
    }
  }
  render(wrapper) {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = wrapper;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(select.booking.floor);
    thisBooking.dom.duration = thisBooking.dom.wrapper.querySelector(select.booking.duration);
    thisBooking.dom.ppl = thisBooking.dom.wrapper.querySelector(select.booking.ppl);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.bookTableBtn = thisBooking.dom.wrapper.querySelector(select.containerOf.bookTableBtn);
  }
  initWidgets() {
    const thisBooking = this;

    const selectedTable = [];
    const validatePhoneNumber = /^\d{9}$/;
    const validateAddress = 10;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });
    thisBooking.dom.floor.addEventListener('click', function (event) {
      event.preventDefault();
      const table = event.target;

      if (table.classList.contains(classNames.booking.tableBooked) && table.classList.contains(classNames.booking.table)) {
        return window.alert('This table is already booked');
      }
      if (table.classList.contains(classNames.booking.tableSelected)) {
        table.classList.remove(classNames.booking.tableSelected);
        thisBooking.updateDOM();
      }
      if (!table.classList.contains(classNames.booking.tableSelected)) {
        thisBooking.updateDOM();
        const tableId = table.getAttribute(settings.booking.tableIdAttribute);
        table.classList.add(classNames.booking.tableSelected);
        thisBooking.selectedTable = tableId;
        selectedTable.pop();
        selectedTable.push(tableId);
      }
    });
    thisBooking.dom.bookTableBtn.addEventListener('click', function (event) {
      event.preventDefault();

      if (!selectedTable[0]) {
        return window.alert('Please choose a table');
      }

      if (!thisBooking.dom.phone.value.match(validatePhoneNumber)) {
        return window.alert('Please enter a valid phone number');
      }

      if(thisBooking.dom.address.value.length < validateAddress){
        return window.alert('Please enter a valid address');
      }
      thisBooking.sendBooking();
    });
  }
  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.date,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.selectedTable),
      duration: parseInt(thisBooking.dom.duration.value),
      ppl: parseInt(thisBooking.dom.ppl.value),
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
      starters: [],
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    };

    fetch(url, options)
      .then(response => response.json())
      .then(parsedResponse => {
        alert('Thank you for booking a table!');
        thisBooking.makeBooked(
          parsedResponse.date,
          parsedResponse.hour,
          parsedResponse.duration,
          parsedResponse.table
        );
        thisBooking.updateDOM();
        console.log('parsedResponseReservation', parsedResponse);
      });
  }
}

export default Booking;