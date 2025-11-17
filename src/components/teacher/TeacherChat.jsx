import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TeacherChat({ teacherId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    // 1. Fetch initial messages
    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*, users(name)')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    }
    fetchMessages();

    // 2. Subscribe to new messages (Realtime!)
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
        async (payload) => {
          // Fetch the user name for the new message
          const { data: userData } = await supabase.from('users').select('name').eq('id', payload.new.user_id).single();
          const newMsg = { ...payload.new, users: userData };
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await supabase.from('messages').insert([{ user_id: teacherId, content: newMessage }]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-900 border-b border-slate-700 font-semibold text-white flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Staff Room Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.user_id === teacherId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                {!isMe && <p className="text-xs text-slate-400 mb-1">{msg.users?.name}</p>}
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-700 flex gap-2">
        <Input 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..." 
          className="bg-slate-800 border-slate-700 text-white"
        />
        <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}