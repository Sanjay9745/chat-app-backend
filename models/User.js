const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    is_online:{
        type: String,
        default: "0"
    },
    socket_id:{
        type: String,
        default: ""
    }
    
},{
    timestamps: true
});

const User = mongoose.model("User", userSchema);

module.exports = User;
