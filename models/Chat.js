const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    sender_id:{
        type:String,
        required: true
    },
    receiver_id:{
        type:String,
        required: true
    },
    message:{
        type: String,
        required: true
    },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;