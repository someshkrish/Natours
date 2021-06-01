// /* eslint-disable */
import axios from 'axios'; //ES6 SYNTAX
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51Ix4CfSDpGTkb8b3OrcWEMKR4IuDH9AHStUbcf9tIELjq2SQFALC2PhsizufYWTKuxzKG2fo4gBFC9iyvgB7TukI00oHlxT2id'
); //Public key for front end.

export const bookTour = async (tourId) => {
  try {
    // 1) Get the session from the server to the Client side
    const session = await axios.get('/api/v1/bookings/checkout-session', {
      params: {
        tourId
      }
    });
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
};
