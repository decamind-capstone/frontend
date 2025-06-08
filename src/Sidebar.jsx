import React, {useState, useEffect} from "react";
import "./../src/Sidebar.css"
import { AiOutlineMore } from "react-icons/ai";
import { BsPencilSquare } from "react-icons/bs";


const Sidebar = ({
    conversations, 
    onSelectConversation, 
    onCreateConversation, 
    selectedConversation,
    onDeleteConversation,
    onRenameConversation,
    favorites,
    onScrollToMessage,
}) => {
    const [activeMenuIndex, setActiveMenuIndex] = useState(null);
    const [favoritesOpen, setFavoritesOpen] = useState(true);

    const toggleMenu = (index) => {
        setActiveMenuIndex((prev) => (prev === index ? null : index));
    };

    const toggleFavorites = () => {
        setFavoritesOpen(!favoritesOpen);
    };
    
    useEffect(() => {
        if (activeMenuIndex === null) return;

        const handleDocumentClick = (event) => {
            setActiveMenuIndex(null);
        };

        document.addEventListener("click", handleDocumentClick);
        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    }, [activeMenuIndex]);

    return (
        <div className="sidebar">
            <div className="favorites-section">
                <div className="favorites-header">
                    찜 목록
                    <button className="favorites-toggle-btn" onClick={toggleFavorites}>
                        {favoritesOpen ? "▲" : "▼" }
                    </button>
                </div>
                <div className="favorite-list">
                {favoritesOpen && (
                    <>
                    {favorites && favorites.length > 0 ? (
                    favorites.map((fav, index) => (
                        <div 
                            key={index} 
                            className="favorite-item"
                            onClick={() => onScrollToMessage(fav)}
                            >
                            {fav.question}
                        </div>
                    ))
                    ) : (
                        <div className="empty-favorites">찜한 답변이 없습니다</div>
                    )}
                    </>
                )}
                </div>
            </div>
            <button className="create-btn" onClick={onCreateConversation}>
                <><BsPencilSquare className="createimg"/> </><span className="span">대화 생성</span>
            </button>
            {conversations.map((conversation, index) => (
                <div
                    key={index}
                    className={`conversation-item ${selectedConversation === index ? "active" : ""}`}
                    onClick={() => onSelectConversation(index)}
                >
                    {conversation.title}
                    <button
                        className="options-btn"
                        onClick={(e)=> {
                            e.stopPropagation();
                            toggleMenu(index);
                        }}
                    >  <AiOutlineMore /> </button> 
                    {activeMenuIndex === index && (
                        <div className="dropdown-menu">
                            <button
                                className="dropdown-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRenameConversation(index);
                                    setActiveMenuIndex(null);
                                }}
                                > 제목 수정</button>
                            <button
                                className="dropdown-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteConversation(index);
                                    setActiveMenuIndex(null);
                                }}
                                > 삭제 </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Sidebar;