import React, {useState, useRef, useEffect} from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";

import './App.css'

const API_BASE = "http://127.0.0.1:8000/v1/conversations";
const API_ASK = "http://127.0.0.1:8000/v1/ask"
const API_HISTORY = "http://127.0.0.1:8000/v1/history"

const App = () =>  {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messageRefs = useRef([]);

  const fetchedHistoryMap = useRef({});

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error("대화 목록 조회 실패");
      }
      const data = await response.json();
      console.log("✅ 대화 목록 GET 성공:", data);
      if (data.success) {
        const loadedConversations = data.response.map(conv => ({
          conversationId: conv.conversationId,
          title: conv.title,
          messages: [],
          favorites: []
        }));
        setConversations(loadedConversations);
        if (loadedConversations.length > 0) setSelectedConversation(0);
      } else {
        throw new Error(data.error || "알 수 없는 오류 발생");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const fetchHistory = async (convId) => {
  try {
    const response = await fetch(
      `${API_HISTORY}?conversationId=${convId}&limit=100&offset=0`
    );
    if (response.status === 404) {
      console.warn("채팅 기록이 없습니다 (404). 빈 기록으로 처리합니다.");
      return [];
    }
    if (!response.ok) {
      throw new Error("채팅 기록 조회 실패");
    }
    const data = await response.json();
    console.log("✅ 채팅 기록 조회 성공:", data);
    
    if (data.success) {
      return data.response ? 
        data.response.map((chat) => ({
          question: chat.question,
          answer: { text: chat.answer },
          createdAt: chat.createdAt,
        }))
        : [];
    } else {
      console.warn("채팅 기록 조회 결과:", data.error || "채팅 기록이 없습니다.");
      return [];
    }
  } catch (err) {
    console.error("🚨 채팅 기록 GET 에러:", err);
    setError(err.message);
    return [];
  }
};

  useEffect(() => {
    const loadHistory = async () => {
      if (conversations.length===0) return;
      const convId = conversations[selectedConversation]?.conversationId;
      if (!convId) return;
      
      if (fetchedHistoryMap.current[convId]) return;
      
      const hist = await fetchHistory(convId);
      setConversations(prevConvs =>
        prevConvs.map((conv, idx) =>
          idx === selectedConversation ? { ...conv, messages: hist } : conv
        )
      );
      
      fetchedHistoryMap.current[convId] = true;
    };
    loadHistory();
  }, [selectedConversation, conversations]);



  const createNewConversation = async () => { 
    const newTitle = `대화 목록 ${conversations.length + 1}`;
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({title: newTitle})
      });
      if (!response.ok) {
        throw new Error("대화 생성 실패");
      }
      const data = await response.json();
      if (data.success) { 
        console.log("✅ 대화 생성 성공:", data);
        const newConv = {
          conversationId: data.response.conversationId,
          title: newTitle,
          messages: [],
          favoirtes: [],
        };
        setConversations([...conversations, newConv]);
        setSelectedConversation(conversations.length);
      } else {
        throw new Error(data.error || "대화 생성 실패");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDeleteConversation = async (index) => {
    if (index < 0 || index >= conversations.length) return;
    const conv = conversations[index];

    try {
      const response = await fetch(`${API_BASE}/${conv.conversationId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("대화 삭제 실패");
      }
      const data = await response.json();
      if (data.success) {
        const updatedConversations = conversations.filter((_, idx) => idx !== index);
        setConversations(updatedConversations);

        if (selectedConversation === index) { setSelectedConversation(0); }
        else if (selectedConversation > index) { setSelectedConversation(selectedConversation - 1); }
      } else {
        throw new Error(data.error || "대화 삭제 실패");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleRenameConversation = async (index) => {
    if (index < 0 || index >= conversations.length) return;
    const currentTitle = conversations[index].title;

    const newTitle = prompt("새로운 대화 제목을 입력하세요", currentTitle);
    if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) return;
    const conv = conversations[index];

    try {
      const response = await fetch(`${API_BASE}/${conv.conversationId}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({title: newTitle})
      });
      if (!response.ok) {
        throw new Error("대화 제목 수정 실패");
      }
      const data = await response.json();
      if (data.success) {
        const updatedConversations = [...conversations];
        updatedConversations[index].title = newTitle;
        setConversations(updatedConversations);
      } else {
        throw new Error(data.error || "대화 제목 수정 실패");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleSendMessage = async (message) => {
    let updatedConversations;

      if (conversations.length === 0) {
    const draftConversation = {
      conversationId: null,
      title: "새로운 대화",
      messages: [],
      favorites: []
    };
    updatedConversations = [draftConversation];
    setConversations(updatedConversations);
    setSelectedConversation(0);
  } else {
    updatedConversations = [...conversations];
  }

    const currentConv = updatedConversations[selectedConversation];
    const convId = currentConv ? currentConv.conversationId : null;

    const placeholderMsg = {
      question: message,
      answer: {text: "답변 준비중입니다...", sources: [] },
      createdAt: new Date().toISOString(),
    };

    updatedConversations[selectedConversation].messages.push(placeholderMsg);
    setConversations(updatedConversations);

    try {
      const response = await fetch(API_ASK, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          conversationId: convId,
          question: message,
        })
      });
      if (!response.ok) { throw new Error("질문 전송 실패"); }

      const data = await response.json();
      console.log("✅ 챗봇 응답 성공: ", data);
      
      if (data.success) {
        const newMsg = {
            question: message,
            answer: {
              text: data.response.answer,
              sources: data.response.sources,
            },
            createdAt: data.response.createdAt,
          };
          let updatedConversations2 = [...updatedConversations];
          if (convId) {
            let updatedConversations2 = [...updatedConversations];
            updatedConversations2[selectedConversation].messages[
              updatedConversations2[selectedConversation].messages.length -1
            ] = newMsg;
            setConversations(updatedConversations2);
          } else {
        // 새 대화(드래프트)인 경우: 백엔드로부터 새 conversationId를 받아 드래프트 업데이트 후 처리합니다.
            updatedConversations2[selectedConversation].conversationId = data.response.conversationId;
            updatedConversations2[selectedConversation].messages[
              updatedConversations2[selectedConversation].messages.length - 1
            ] = newMsg;
            setConversations(updatedConversations2);
      }



        

        const history = await fetchHistory(data.response.conversationId);
        updatedConversations = updatedConversations.map((conv) => 
          conv.conversationId === data.response.conversationId 
            ? {...conv, messages: history}
            : conv
        );
        setConversations(updatedConversations2);
      } else {
        throw new Error(data.error || "질문 전송 실패");
      }
    } catch (err) {
        console.error("Error sending message: ", err);
        setError(err.message);
    }
  };

  const handleFavoriteMessage = (message) => {
    const updatedConversations = [...conversations];
    
    if (!updatedConversations[selectedConversation].favorites) {
      updatedConversations[selectedConversation].favorites = [];
    }

    const currentFavorites = updatedConversations[selectedConversation].favorites;
    if (currentFavorites.some((fav) => fav.question === message.question)) {
      updatedConversations[selectedConversation].favorites = currentFavorites.filter(
        (fav) => fav.question !== message.question
      );
    } else {
      updatedConversations[selectedConversation].favorites.push({question:message.question})
    }
    setConversations(updatedConversations);
  };

  const handleScrollToMessage = (targetMessage) => {
    const currentMessages = conversations[selectedConversation]?.messages || [];
    const index = currentMessages.findIndex(
      (m) => (m.question?.trim() || "") === (targetMessage.question?.trim() || "")
    );
    if (index !== -1 && messageRefs.current[index]) {
      messageRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      console.error("message not found", targetMessage);
    }
  };

  return (
    <div className="app">
      <div className="sidebar-section">
        <Sidebar 
          conversations={conversations} 
          onSelectConversation={setSelectedConversation}
          onCreateConversation={createNewConversation}
          selectedConversation={selectedConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          favorites={conversations[selectedConversation]?.favorites || []}
          onScrollToMessage={handleScrollToMessage}
        /> 
      </div>
     
        <div className="chat-section"> 
          <ChatWindow 
            messages={conversations[selectedConversation]?.messages || []} 
            onFavorite={handleFavoriteMessage}
            favorites={conversations[selectedConversation]?.favorites || []}
            ref={messageRefs}
          />
          <MessageInput onSend={handleSendMessage} />
        </div>
    </div>
  );
};

export default App
