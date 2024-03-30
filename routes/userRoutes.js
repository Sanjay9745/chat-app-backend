const router = require('express').Router();
const userController = require('../controllers/userController');
const userAuth = require('../middleware/userAuth');

router.get('/get-chat/:receiver_id',userAuth,userController.GetChatByUser);
router.get("/protected",userAuth,(req,res)=>{
    res.status(200).json({message:"Protected route"})
})
router.get('/get-all-users',userAuth,userController.getAllUsers);
router.post('/login',userController.Login);
router.post('/register',userController.Register);
router.post('/update',userAuth,userController.UpdateUser);
router.post('/add-chat',userAuth,userController.AddChat);
router.post('/delete-all-chat',userAuth,userController.DeleteAllChat);
router.post('/update-chat',userAuth,userController.UpdateChat);
router.post('/delete-single-chat',userAuth,userController.DeleteSingleChat);

module.exports = router;