const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
//Since we are manipulating the user document we need a patch request
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updateMe',
  authController.isLoggedIn,
  userController.uploadUserPhoto,
  userController.resizedUserPhoto,
  userController.updateMe
);

//The routes after this middleware are protected routes and the above routes are not protected
//Since middleware runs in sequence, in the middleware if the below routes has to be executed this protect middleware has to be executed successfully.
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

//All the below routes are protected as well as restricted to only for the use administrators
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
