const multer = require('multer');
const sharp = require('sharp'); //Image processing library in node.js

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Multer is a multipart middleware which facilitates us to upload image, csv etc in form.
// Images are not directly uploaded in the database. Only the links to the images are only uploaded in the database.

//CONFIGURING MULTER
//----------------------------------------------------------------------------------------------
//cb -> callback function
//If there is a image or any file upload in the request req.file will be available.
//req.file:
//{
//  fieldname: 'photo',
//  originalname: 'leo.jpg',
//  encoding: '7bit',
//  mimetype: 'image/jpeg',
//  destination: 'public/img/users',
//  filename: 'aca3079a276a5757aacd9f7038fdc4c0',
//  path: 'public/img/users/aca3079a276a5757aacd9f7038fdc4c0',
//  size: 207078
//}

// //Creating multer storage
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user - userID - currentTimeStamp.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

//The above code is to store the photo in the disk storage before processing the file
//So now we are going to store the photo in the memory and process the image and store it.

//Storing the image in the buffer or in memory
const multerStorage = multer.memoryStorage(); //The image file is stored in req.file.buffer

//creating multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not An Image! Please Upload only Images.', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

//upload.single() is used to indicate that we want to upload only one image and 'photo' is the field in the form which holds the photo to be uploaded.
exports.uploadUserPhoto = upload.single('photo');

//IMAGE PROCESSING
//Converting the file to a square shaped image and maintaining the quality.
exports.resizedUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //All image files are going to be converted to jpeg files.
  //We are defining it here because again we need this while updating our database. Previously it was done by the multerStorage method so that's why we are defining it here now.

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
//---------------------------------------------------------------------------------------------

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

  // 1) If user posts password data generate console.error
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates, Please use /updateMyPassword route',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields like roles etc that are not allowed to be updated
  const filteredObj = filterObj(req.body, 'name', 'email');
  if (req.file) filteredObj.photo = req.file.filename;

  // 3) Update user document
  // authController.protect adds the user object to req object so we get access to user id.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do not update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
