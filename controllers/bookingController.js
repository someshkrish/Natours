const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); //Will return an object to work with.

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.query.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.query.tourId
    }&user=${req.user.id}&price=${tour.price}`, // Go to home page
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // Go to the same tour page.
    customer_email: req.user.email,
    client_reference_id: req.query.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //this is temporary because it is unsecure everyone can make payment without paying becoz passing this query creates an entry in the bookings database, so this is unsecure.
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  // req.originalUrl = success_url: `${req.protocol}://${req.get('host')}/?tour=${req.query.tourId}
  // &user=${req.user.id}&price=${tour.price}`
  //Since this successurl is a request to home page in tourrouter you can see that after this protect middleware has to run and then overview in both this controller we will be exposing our query which is not secure so we are literally doing some trick to hide the query.
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
