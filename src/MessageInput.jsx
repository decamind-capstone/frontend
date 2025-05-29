import React, {useState} from "react";
import "./MessageInput.css"
import { AiOutlineArrowRight } from "react-icons/ai";


const MessageInput = ({ onSend }) => {
    const [input, setInput] = useState("");

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setInput("");
        }
    };

    return (
        <div className="message-input">
            <input 
                type="text"
                placeholder="챗봇에게 필요한 정보를 질문해보세요!"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
            />
            <button onClick={handleSend}> <AiOutlineArrowRight className="sendimg"/> </button>
        </div>
    );
};

export default MessageInput;