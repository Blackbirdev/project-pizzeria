import { templates, select, classNames } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    thisHome.initWidgets();
    thisHome.initPages();
  }
  render(element) {
    const thisHome = this;

    const generatedHTML = templates.homeWidget();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.dom.homeHeader = thisHome.dom.wrapper.querySelector(select.home.homeHeader);
  }

  initPages() {
    const thisHome = this;

    thisHome.orderLink = document.querySelector(select.containerOf.orderLink);
    thisHome.bookingLink = document.querySelector(select.containerOf.bookingLink);

    thisHome.orderLink.addEventListener('click', function (event) {
      event.preventDefault();
      const orderId = document.getElementById('order');
      thisHome.activatePage(orderId);

    });
    thisHome.bookingLink.addEventListener('click', function (event) {
      event.preventDefault();
      const bookingId = document.getElementById('booking');
      thisHome.activatePage(bookingId);
    });
  }
  activatePage(pageId) {
    const thisHome = this;

    pageId.classList.add(classNames.pages.active);
    thisHome.homeId = document.getElementById('home');
    thisHome.homeId.classList.remove(classNames.pages.active);

    const navLinks = document.querySelectorAll(select.nav.links);

    for (let navLink of navLinks) {

      if (navLink.getAttribute('href') == '#' + thisHome.homeId.id) {
        navLink.classList.remove(classNames.nav.active);
      }
      if (navLink.getAttribute('href') == '#' + pageId.id) {
        navLink.classList.add(classNames.nav.active);
      }
    }
  }
  initWidgets() {
    const carouselElem = document.querySelector('.main-carousel');

    new Flickity(carouselElem, { /* eslint-disable-line */
      imagesLoaded: true,
      pageDots: true,
      percentPosition: false,
      autoPlay: true,
      prevNextButtons: false,
    });
  }
}

export default Home;