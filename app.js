//core modules
const path = require('path');

//other-modules
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

//imported functions
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

//setting up the template engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// for render() it automatically finds the path to the pug template

//serving static files
// It helps to find the js, css and images
app.use(express.static(path.join(__dirname, 'public')));

//Global Middlewares

// Security HTTP headers
// Usually inside app.use() there won't be any function calls but here helmet() is called which
// in turn returns a function which waits there until that returned function is called.
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit request from same IP address
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //allows 100 requests from same IP in one hour
  message: 'Too manys requests from this IP, Please try again in an hour.'
});
app.use('/api', limiter);

// Body Parser, reading data from body into req.body -> limit the data to 10 kilobytes
// Body Parser can't handle image data that's why we use multer package.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //This middleware is used to get data from the url as we have used form to submit changes to our profile which by default is sent to the router via urlencoded method we need this middleware to extract data from the url and to keep it in the req.body object.
app.use(cookieParser()); //parses the data from cookie

// Data sanitization agains NoSql query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Mounting the exported routers on a route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

//Error handler for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
