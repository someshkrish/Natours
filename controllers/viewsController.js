const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tour data from our collection
  const tours = await Tour.find();

  // 2. Build Template

  // 3. Render that template using tour data from step 1.
  // `connect-src ws://127.0.0.1:*/`
  // 127.0.0.1:3000
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      `connect-src ${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/logout ws://${req.hostname}:*/ wss://${req.hostname}:*/`
    )
    .render('overview', {
      title: 'All Tours',
      tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. Get data from collection
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There Is No Such Tour With That Name.', 404));
  }
  // 2. Build The Template

  // 3. Render that template usind data from step 1
  // ${req.protocol}://${req.get('host')} http://127.0.0.1:3000/api/v1/users/logout https://${
  //   req.hostname
  // }/api/v1/users/logout
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      `connect-src ws://${req.hostname}:*/ wss://${
        req.hostname
      }:*/ https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com https://js.stripe.com/v3 ${
        req.protocol
      }://${req.get('host')}/api/v1/users/logout ${req.protocol}://${req.get(
        'host'
      )}/api/v1/bookings/checkout-session`
    )
    .render('tour', {
      title: `${tour.name} | Tour`,
      tour
    });
});

exports.getLoginForm = (req, res, next) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      `connect-src ws://${req.hostname}:*/ wss://${req.hostname}:*/ ${
        req.protocol
      }://${req.get('host')}/api/v1/users/login`
    )
    .render('login', {
      title: 'Login'
    });
};

exports.getAccount = (req, res) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      `connect-src ${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/updateMyPassword ${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/updateMe ${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/logout ${req.protocol}://${req.get(
        'host'
      )}/my-tours ws://${req.hostname}:*/ wss://${req.hostname}:*/`
    )
    .render('account', {
      title: 'Your Account'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  //select all the tours which has the _id which is 'in' 'tourIds' array.

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

// This module is user while using the traditional FORM submit but later we have modified the code for api updating
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true, //This new set to true will return the update thing as the result in this case it is the updated user.
      runValidators: true //This will run all mongodb validators.
    }
  );
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      `connect-src ${req.protocol}://${req.hostname}/api/v1/users/logout ws://${req.hostname}:*/ wss://${req.hostname}:*/`
    )
    .render('account', {
      title: 'Your Account',
      user: updatedUser
      //We have set user to updated user because normally we will protect or check whether the user is logged in or not in the that will pass the user to the pug template so while rerendering the page only the old authenticated user data will be persisted in the req.user object coz we are not running protect or loggedin middleware here which will update the user object. So here we have to explicitly set the user to the updatedUser in order to render the updated information.
    });
});
