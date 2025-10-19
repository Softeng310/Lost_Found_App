import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowLeft, Send, Check } from '../components/ui/icons';
import { Button } from '../components/ui/button';
import { cardStyles } from '../lib/utils';

const MessagesPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const messagesEndRef = useRef(null);

  // Helper: fetch item document by id (returns null if not found)
  const fetchItemData = useCallback(async (itemId) => {
    if (!itemId) return null;
    try {
      const itemDoc = await getDoc(doc(db, 'items', itemId));
      return itemDoc.exists() ? { id: itemDoc.id, ...itemDoc.data() } : null;
    } catch (error) {
      console.error('Error fetching item:', error);
      return null;
    }
  }, []);

  // Helper: fetch user display name by uid (returns fallback if not found)
  const fetchUserNameById = useCallback(async (uid) => {
    if (!uid) return 'Unknown User';
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) return 'Unknown User';
      const userData = userDoc.data();
      return userData.displayName || userData.name || userData.email || 'Unknown User';
    } catch (error) {
      console.error('Error fetching user:', error);
      return 'Unknown User';
    }
  }, []);

  // Helper: enrich a list of conversation docs with item data and participant name
  const enrichConversations = useCallback(async (docs, userUid) => {
    const promises = docs.map(async (docSnapshot) => {
      const conversationData = docSnapshot.data();
      const [itemData, otherParticipantName] = await Promise.all([
        fetchItemData(conversationData.itemId),
        fetchUserNameById(conversationData.participants.find(id => id !== userUid))
      ]);

      return {
        id: docSnapshot.id,
        ...conversationData,
        item: itemData,
        otherParticipantName
      };
    });

    return Promise.all(promises);
  }, [fetchItemData, fetchUserNameById]);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Load conversations for the current user
  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participants', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const enriched = await enrichConversations(snapshot.docs, user.uid);

        // Sort conversations by lastMessageTime (handle missing timestamps)
        enriched.sort((a, b) => {
          const aTime = a.lastMessageTime?.seconds || a.createdAt?.seconds || 0;
          const bTime = b.lastMessageTime?.seconds || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setConversations(enriched);

        // Auto-select conversation if itemId is in URL params
        const itemId = searchParams.get('item');
        if (itemId && enriched.length > 0) {
          const conversation = enriched.find(c => c.itemId === itemId);
          if (conversation) setSelectedConversation(conversation);
        }
      } catch (error) {
        console.error('Error processing conversations:', error);
      }
    });

    return () => unsubscribe();
  }, [user, searchParams, enrichConversations]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    const messagesRef = collection(db, 'messages');
    
    // Try without ordering first to see if messages exist
    const q = query(
      messagesRef,
      where('conversationId', '==', selectedConversation.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort messages by timestamp (handle cases where timestamp might be missing)
      messagesList.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return aTime - bTime;
      });
      
      setMessages(messagesList);
      
      // Auto-scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length]);

  // Send a new message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sendingMessage) return;

    setSendingMessage(true);
    try {
      // Add message to messages collection
      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation.id,
        senderId: user.uid,
        senderName: user.displayName || user.email || 'Anonymous',
        text: newMessage.trim(),
        timestamp: Timestamp.now()
      });

      // Update conversation's last message info
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageTime: Timestamp.now(),
        lastMessageSender: user.uid
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedConversation, user, sendingMessage]);

  // 'Mark item retrieved' is now a no-op; marking items as 'found' only happens at creation time.
  const markItemRetrieved = useCallback(async () => {
    // intentionally do nothing; kept as a placeholder per app policy
    console.debug('markItemRetrieved called but is disabled by app configuration');
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto" style={{ paddingTop: '6px' }}>
      <div className="flex justify-start mb-6">
        <Button
          onClick={() => navigate('/feed')}
          variant="ghost"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Button>
      </div>
      
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Chat with other users about items</p>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-6 h-[600px]">
        {/* Conversations List */}
        <div className={`${cardStyles.base} overflow-hidden flex flex-col`}>
          <div className="p-4 border-b flex-shrink-0">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start messaging about items to see conversations here</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  aria-label={`Conversation about ${conversation.item?.title || 'Deleted Item'} with ${conversation.otherParticipantName}`}
                  aria-current={selectedConversation?.id === conversation.id ? 'true' : undefined}
                  className={`w-full text-left p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-emerald-50 border-emerald-200' : ''
                  } focus:outline-none`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    {conversation.item?.imageUrl && (
                      <img
                        src={conversation.item.imageUrl}
                        alt={conversation.item.title}
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {conversation.item?.title || 'Deleted Item'}
                        </h3>
                        {conversation.item?.status === 'found' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Found
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        with {conversation.otherParticipantName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className={`${cardStyles.base} flex flex-col overflow-hidden`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedConversation.item?.imageUrl && (
                    <img
                      src={selectedConversation.item.imageUrl}
                      alt={selectedConversation.item.title}
                      className="w-10 h-10 rounded-lg object-cover border"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.item?.title || 'Deleted Item'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      with {selectedConversation.otherParticipantName}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={markItemRetrieved}
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                >
                  <Check className="h-4 w-4" />
                  Item Retrieved
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p>No messages yet</p>
                      <p className="text-sm mt-1">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user.uid
                            ? 'bg-emerald-600'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p 
                          className={`text-sm ${
                            message.senderId === user.uid ? '' : 'text-gray-900'
                          }`}
                          style={message.senderId === user.uid ? { color: '#FFFFFF' } : undefined}
                        >
                          {message.text}
                        </p>
                        <p 
                          className={`text-xs mt-1 ${
                            message.senderId === user.uid ? '' : 'text-gray-500'
                          }`}
                          style={message.senderId === user.uid ? { color: '#FFFFFF' } : undefined}
                        >
                          {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={sendingMessage}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the left to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;