const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Chat = require("../models/Chat");

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findOne({ email});

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Login successful", token, userId: user._id});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const Register = async (req, res) => {
  try {
    const { email, password,name } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword ,name});
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({ message: "User created successfully", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const UpdateUser = async (req, res) => {
  try {
    const { email, password, is_online } = req.body;
    
    const user = await User.findById(req.user.id);
    if (email) {
      user.email = email;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (is_online) {
      user.is_online = is_online;
    }
    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const AddChat = async (req, res) => {
  try {
    const { receiver_id, message } = req.body;
    const chat = await Chat.create({ sender_id:req.user.id, receiver_id, message });
    res.status(200).json({ message: "Chat created successfully", chat });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const GetChatByUser = async (req, res) => {
  try {
    const { receiver_id } = req.params;
    const sender_id = req.user.id;
    //find chat between sender:sender_id and receiver:receiver_id or sender:receiver_id and receiver:sender_id
    const chat = await Chat.find({
      $or: [
        { sender_id, receiver_id },
        { sender_id: receiver_id, receiver_id: sender_id },
      ],
    });
    res.status(200).json({ chat });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const DeleteAllChat = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;
    await Chat.deleteMany({ sender_id, receiver_id });
    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const UpdateChat = async (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;
    const chat = await Chat.findOne({ sender_id, receiver_id });
    if (message) {
      chat.message = message;
    }
    await chat.save();
    res.status(200).json({ message: "Chat updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const DeleteSingleChat = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;
    await Chat.deleteOne({ sender_id, receiver_id });
    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAllUsers = async(req, res) => {
  try {
    const users = await User.find({_id: {$ne: req.user.id}}).select("name email is_online");
    res.status(200).json({users});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}


module.exports = { 
    Login, 
    Register,
    UpdateUser,
    AddChat,
    GetChatByUser,
    DeleteAllChat,
    UpdateChat,
    DeleteSingleChat,
    getAllUsers
};
