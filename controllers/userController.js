const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Chat = require("../models/Chat");

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res
      .status(200)
      .json({ message: "Login successful", token, userId: user._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const Register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({ message: "User created successfully", token, userId: user._id});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const GetUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  
  }
}
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
    const chat = await Chat.create({
      sender_id: req.user.id,
      receiver_id,
      message,
    });
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
    const { receiver_id } = req.body;
    const sender_id = req.user.id;
    await Chat.deleteMany({
      $or: [
        { sender_id, receiver_id },
        { sender_id: receiver_id, receiver_id: sender_id },
      ],
    });
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
    const chat = await Chat.findById(req.params.id);
    await Chat.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Chat deleted successfully", chat });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Pagination parameters
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch users with pagination and selective fields
    const usersQuery =await  User.find({ _id: { $ne: req.user.id }, name: { $regex: search, $options: "i" } })
      .select("name email is_online friends _id")
      .skip(skip)
      .limit(limit);

    // Execute the query
    const users = usersQuery.map((user) => user.toObject());

    // Map users and add the 'isFriend' field
   let processedUsers = users.map((usr) => {
      if (!user || user.friends.length === 0) {
        usr.isFriend = false;
      } else {
        const isFriend = user.friends.some((friend) => friend.id === usr._id.toString());
        usr.isFriend = isFriend;
      }
      return usr;
    });

    // Count total users (for pagination metadata)
    const totalUsersCount = await User.countDocuments({ _id: { $ne: req.user.id } });

    res.status(200).json({ users: processedUsers, totalUsersCount, page, limit });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let friends = user.friends.map(async (friend) => {
      if (friend && friend.accepted === true) { // Add null check for friend
        const friendData = await User.findById(friend.id).select(
          "name email is_online _id latestOnline"
        );
        return friendData;
      }
      return null; // Return null for invalid friends
    });
    friends = await Promise.all(friends);

    // Filter out null values before sending response
    friends = friends.filter((friend) => friend !== null);

    res.status(200).json({ users: friends });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    let friends = user.friends.map(async (friend) => {
      if (friend && friend.id && friend.accepted === false) { // Add null checks
        const friendData = await User.findById(friend.id).select(
          "name email is_online"
        );
        return friendData;
      }
      return null; // Return null for invalid friends
    });

    friends = await Promise.all(friends);
    
    // Filter out null values before sending response
    friends = friends.filter(friend => friend !== null);

    res.status(200).json({ users: friends });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const AddFriendRequest = async (req, res) => {
  try {
    const { receiver_id } = req.body;
    if(!receiver_id){
      return res.status(400).json({ message: "Receiver id is required" });
    }
    const userId = req.user.id;
    const user = await User.findById(userId);
    //check id already exists in friends
    const friendExists = user.friends.find((f) => f.id === receiver_id);
    if (friendExists) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    const friend = await User.findById(receiver_id);
    if (!friend) {
      return res.status(400).json({ message: "Receiver not found" });
    }
      const isFriend = friend.friends.find((f) => f.id === userId);
      if (isFriend) {
        return res.status(400).json({ message: "Friend request already sent" });
      }
    user?.friends?.push({
      id: receiver_id,
      accepted: false,
    });
    

    friend?.friends?.push({
      id: userId,
      accepted: true,
    });
    
    await friend.save();
    await user.save();
    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const AcceptFriendRequest = async (req, res) => {
  try {
    const { sender_id } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    const friend = await User.findById(sender_id);
    const userFriend = user.friends.find((f) => f.id === sender_id);
    const friendFriend = friend.friends.find((f) => f.id === userId);
    userFriend.accepted = true;
    friendFriend.accepted = true;
    await user.save();
    await friend.save();
    res.status(200).json({ message: "Friend request accepted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const RejectFriendRequest = async (req, res) => {
  try {
    const { sender_id } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    const friend = await User.findById(sender_id);
    user.friends = user.friends.filter((f) => f.id !== sender_id);
    friend.friends = friend.friends.filter((f) => f.id !== userId);
    await user.save();
    await friend.save();
    res.status(200).json({ message: "Friend request rejected successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
module.exports = {
  Login,
  Register,
  UpdateUser,
  GetUserDetails,
  AddChat,
  GetChatByUser,
  DeleteAllChat,
  UpdateChat,
  DeleteSingleChat,
  getAllUsers,
  getFriends,
  AddFriendRequest,
  AcceptFriendRequest,
  RejectFriendRequest,
  getAllFriendRequests
};
