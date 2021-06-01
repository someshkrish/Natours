const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please mention your review...']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour...']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user...']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Creating a compound index
//to avoid duplicate reviews in a tour by the same user.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query Middleware
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// Static methods: In static method the 'this' keyword points to the model
// here the 'this' keyword points to the review model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate(
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  );

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

//Document middleware
//why post?
//because then only the new created review will be saved to the database and it will be avalilable for calculation in calAverageRatings.
reviewSchema.post('save', function () {
  //'this' points to the current review(current document).
  //'this.constructor' points to the model (i.e. Review).
  //'constructor' pionts to the model which created that document('this').
  this.constructor.calcAverageRatings(this.tour);
  //'this.tour' points to the tour id we created.
});

//findByIdAndUpdate and findByIdAndDelete are short hand for findOneAndUpdate and findOneAndDelete.
//first we use post query middleware hook and before executing the query we are storing that particular review to the query object.
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.review = await this.findOne();
  console.log(this.review);
  console.log(this);
  next();
});

//now passing the review  ID in the query object to the static method in the module
reviewSchema.post(/^findOneAnd/, async function () {
  //this.review = await this.findOne(); does not work here bcoz the query has already finished executing
  // why we are executing the below in the post hook is that if we pass this to the staic module before the change is saved to the database our data won't be modified.
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
