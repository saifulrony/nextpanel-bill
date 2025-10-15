// This script sets the cart page configuration in localStorage
// Run this in the browser console on localhost:4000

const config = {
  cart: "about",
  shop: null,
  checkout: null,
  order_success: null,
  about: null,
  contact: null,
  privacy: null,
  terms: null
};

localStorage.setItem('default_page_config', JSON.stringify(config));
console.log('Cart page configuration set:', config);
console.log('Now navigate to /cart to see the about page content');
