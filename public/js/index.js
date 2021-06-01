/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

//DOM elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const bookingBtn = document.getElementById('book-tour');

//VALUES
// const email = document.getElementById('email').value;
// const password = document.getElementById('password').value;

//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); //prevents the form from loading any other page
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (updateForm) {
  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]); //The files are array, since we need only one photo which has to be uploaded we use 'files[0]'

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    await updateSettings(form, 'data');
    //AJAX call axios will recognize 'form' passed into updateSettings as object and do the procedure.
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    document.querySelector('.btn--updating').textContent = 'Updating';

    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';

    document.querySelector('.btn--updating').textContent = 'Save password';
  });
}

if (bookingBtn) {
  bookingBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing....';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}
