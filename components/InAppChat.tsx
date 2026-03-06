import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';

const isWebDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 768;
};

const getCustomerId = (): string => {
  if (typeof window !== 'undefined') {
    let id = localStorage.getItem('chatCustomerId');
    if (!id) {
      id = 'cust_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chatCustomerId', id);
    }
    return id;
  }
  return 'cust_' + Math.random().toString(36).substring(2, 15);
};

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'supplier';
  timestamp: Date;
}

interface InAppChatProps {
  buttonColor?: string;
  companyName?: string;
  customerName?: string;
  hideWhenCartOpen?: boolean;
}

const InAppChat: React.FC<InAppChatProps> = ({ 
  buttonColor = '#ffc100', 
  companyName = 'FluidPower Group',
  customerName = 'Guest',
  hideWhenCartOpen = false
}) => {
  const router = useRouter();
  const isPWAPage = router.pathname.startsWith('/suite360');
  
  const [scale, setScale] = useState(1);
  const [modalOpacity, setModalOpacity] = useState(0);
  const [modalTransform, setModalTransform] = useState(50);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: 'Hello! How can we help you?', 
      sender: 'supplier', 
      timestamp: new Date() 
    }
  ]);
  const [customerId] = useState(getCustomerId());
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  
  // Determine z-index based on page
  const buttonZIndex = isPWAPage ? 10000 : 999;
  const modalZIndex = isPWAPage ? 10001 : 1000;

  // Handle mounting and check if mobile
  useEffect(() => {
    setMounted(true);
    setIsMobile(!isWebDesktop());
    
    const handleResize = () => {
      setIsMobile(!isWebDesktop());
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      setMounted(false);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Reset state when navigating to PWA page
  useEffect(() => {
    if (isPWAPage) {
      setIsChatOpen(false);
      setMessage('');
    }
  }, [isPWAPage]);

  // Pulse animation
  useEffect(() => {
    let startTime: number;
    const duration = 2000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      const scaleValue = 1 + Math.sin(progress * Math.PI) * 0.05;
      setScale(scaleValue);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/telegram/get-messages?customerId=${customerId}`);
      const data = await response.json();
      
      if (data.success && data.messages.length > 0) {
        const formattedMessages = data.messages.map((msg: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          text: msg.text,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp)
        }));
        setChatMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [customerId]);

  useEffect(() => {
    if (isChatOpen) {
      fetchMessages();
    }
  }, [isChatOpen, fetchMessages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isChatOpen) {
      interval = setInterval(fetchMessages, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isChatOpen, fetchMessages]);

  const sendMessage = async () => {
    if (message.trim() === '') return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'customer',
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const messageText = message;
    setMessage('');
    
    try {
      await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          customerName,
          message: messageText
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const openChat = () => {
    setIsChatOpen(true);
    let start: number;
    const duration = 300;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      setModalOpacity(progress);
      setModalTransform(50 - (50 * progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const closeChat = () => {
    let start: number;
    const duration = 300;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      setModalOpacity(1 - progress);
      setModalTransform(50 * progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsChatOpen(false);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const renderMessage = (item: Message) => {
    const isSupplier = item.sender === 'supplier';
    return (
      <div
        key={item.id}
        style={{
          maxWidth: '75%',
          padding: '12px',
          borderRadius: '15px',
          marginBottom: '10px',
          alignSelf: isSupplier ? 'flex-start' : 'flex-end',
          backgroundColor: isSupplier ? '#f0f0f0' : buttonColor,
          borderTopLeftRadius: isSupplier ? '2px' : '15px',
          borderTopRightRadius: isSupplier ? '15px' : '2px',
        }}
      >
        <div style={{ fontSize: '16px', color: '#333' }}>{item.text}</div>
        <div style={{ fontSize: '10px', color: '#666', textAlign: 'right', marginTop: '4px' }}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  // Hide chat button when cart is open (if prop is passed)
  if (hideWhenCartOpen) return null;

  const chatContent = (
    <>
      {/* Floating Chat Button */}
      <div
        id="fpg-chat-button"
        style={{
          position: 'fixed',
          bottom: '60px',
          right: '20px',
          zIndex: buttonZIndex,
          transform: `scale(${scale})`,
          transition: 'transform 0.1s ease',
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={openChat}
          style={{
            paddingLeft: isMobile ? '14px' : '20px',
            paddingRight: isMobile ? '14px' : '20px',
            paddingTop: isMobile ? '14px' : '12px',
            paddingBottom: isMobile ? '14px' : '12px',
            borderRadius: isMobile ? '50%' : '50px',
            backgroundColor: buttonColor,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 6px rgba(0,0,0,0.27)',
            width: isMobile ? '56px' : 'auto',
            height: isMobile ? '56px' : 'auto',
          }}
        >
          {isMobile ? (
            // Simple chat bubble icon for mobile
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          ) : (
            // Desktop: Icon with text
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#4a4a4a">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1zm-7-3.3h2V11c0 .6-.4 1-1 1s-1-.4-1-1-.4-1-1-1 1-.4 1-1h2c0-1.1-.9-2-2-2s-2 .9-2 2c0 .6.4 1 1 1zm1 5.3c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z"/>
              </svg>
              <span style={{ color: '#4a4a4a', fontWeight: 'bold', marginLeft: '8px', fontSize: '16px' }}>
                Chat
              </span>
            </>
          )}
        </button>
      </div>

      {/* Chat Modal */}
      {isChatOpen && (
        <div
          id="fpg-chat-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: modalZIndex,
            pointerEvents: 'auto',
          }}
        >
          <div
            onClick={closeChat}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          />
          
          <div
            style={{
              position: isWebDesktop() ? 'fixed' : 'relative',
              bottom: isWebDesktop() ? '30px' : 'auto',
              right: isWebDesktop() ? '30px' : 'auto',
              width: isWebDesktop() ? '380px' : '90%',
              height: isWebDesktop() ? '550px' : '70%',
              maxWidth: isWebDesktop() ? 'none' : '400px',
              maxHeight: isWebDesktop() ? '80vh' : 'none',
              backgroundColor: '#fff',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 5px 15px rgba(0,0,0,0.34)',
              display: 'flex',
              flexDirection: 'column',
              opacity: modalOpacity,
              transform: `translateY(${modalTransform}px)`,
              transition: 'opacity 0.1s, transform 0.1s',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '15px',
                backgroundColor: '#f8f8f8',
                borderBottom: '1px solid #eee',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4a4a4a' }}>
                Chat with {companyName}
              </div>
              <button
                onClick={closeChat}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  color: '#4a4a4a',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '0 10px',
                  lineHeight: '1',
                }}
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {chatMessages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                display: 'flex',
                padding: '10px',
                borderTop: '1px solid #eee',
                backgroundColor: '#f8f8f8',
              }}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  padding: '10px 15px',
                  borderRadius: '20px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={message.trim() === ''}
                style={{
                  marginLeft: '10px',
                  width: '40px',
                  background: 'none',
                  border: 'none',
                  cursor: message.trim() === '' ? 'not-allowed' : 'pointer',
                  opacity: message.trim() === '' ? 0.5 : 1,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 512 512" fill={buttonColor}>
                  <path d="M476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0027.14 52 24.65 24.65 0 0016 72.59v113.29a24 24 0 0019.52 23.57l232.93 43.07a4 4 0 010 7.86L35.53 303.45A24 24 0 0016 327v113.31A23.57 23.57 0 0026.59 460a23.94 23.94 0 0013.22 4 24.55 24.55 0 009.52-1.93L476.4 285.94l.19-.09a32 32 0 000-58.8z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Use portal for PWA page to render outside normal flow
  if (isPWAPage && typeof document !== 'undefined') {
    return createPortal(chatContent, document.body);
  }

  // Normal rendering for other pages
  return chatContent;
};

export default InAppChat;