const router = require('express').Router();
const userController = require('../controllers/userController');
const userAuth = require('../middleware/userAuth');

router.get('/get-chat/:receiver_id',userAuth,userController.GetChatByUser);
router.get("/protected",userAuth,(req,res)=>{
    res.status(200).json({message:"Protected route"})
})
router.get('/get-all-users',userAuth,userController.getAllUsers);
router.get('/get-friends',userAuth,userController.getFriends);
router.get('/get-friend-requests',userAuth,userController.getAllFriendRequests);
router.get('/details',userAuth,userController.GetUserDetails);

router.post('/login',userController.Login);
router.post('/register',userController.Register);
router.post('/update',userAuth,userController.UpdateUser);
router.post('/add-chat',userAuth,userController.AddChat);
router.post('/delete-all-chat',userAuth,userController.DeleteAllChat);
router.post('/update-chat',userAuth,userController.UpdateChat);
router.post('/add-friend-request',userAuth,userController.AddFriendRequest);
router.post('/accept-friend-request',userAuth,userController.AcceptFriendRequest);
router.post('/reject-friend-request',userAuth,userController.RejectFriendRequest);



router.delete('/delete-single-chat/:id',userAuth,userController.DeleteSingleChat);

module.exports = router;