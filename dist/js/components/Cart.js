import {settings, classNames, select, templates} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions(element);
    //console.log('new Cart:', thisCart);
  }
  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
  }
  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', () => {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', () => {
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', (event) => {
      event.preventDefault();
      thisCart.remove(event.detail.cartProduct);
    });
    thisCart.dom.form.addEventListener('submit', (event) => {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }
  add(menuProduct) {
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
    //console.log('thisCart.products:', thisCart.products);
    //console.log('adding product:', menuProduct);
  }
  update() {
    const thisCart = this;
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let product of thisCart.products) {
      thisCart.subtotalPrice += product.price;
      thisCart.totalNumber += product.amount;
      console.log('thisCart.products:', product.price);
    }
    if (thisCart.totalNumber != 0) {
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    } else {
      thisCart.totalPrice = 0;
      thisCart.deliveryFee = 0;
    }
    
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;

    for (let price of thisCart.dom.totalPrice) {
      price.innerHTML = thisCart.totalPrice;
    }
  }
  remove(cartProduct) {
    const thisCart = this;

    const indexOfProduct = thisCart.products.indexOf(cartProduct);

    thisCart.products.splice(indexOfProduct, 1);
    cartProduct.dom.wrapper.remove();
    thisCart.update();
  }
  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {
      phone: thisCart.dom.phone,
      address: thisCart.dom.address,
      totalPrice: thisCart.dom.totalPrice,
      subtotalPrice: thisCart.dom.subtotalPrice,
      totalNumber: thisCart.dom.totalNumber,
      deliveryFee: thisCart.dom.deliveryFee,
      products: [],
    };
    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
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
        console.log('parsedResponse:', parsedResponse);
      });
  }
}

export default Cart;