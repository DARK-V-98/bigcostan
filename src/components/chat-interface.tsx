
'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/auth-provider';
import { db, storage } from '@/lib/firebase-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  imageUrls?: string[];
}

export default function ChatInterface({ chatRoomId }: { chatRoomId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'chats', chatRoomId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
    return () => unsubscribe();
  }, [chatRoomId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSendMessage = async () => {
    if (!user || (!newMessage.trim() && !file)) return;

    setIsSending(true);
    let imageUrls: string[] = [];

    try {
        if (file) {
            const storageRef = ref(storage, `chatFiles/${chatRoomId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            imageUrls.push(downloadUrl);
        }

        const messageData = {
            text: newMessage,
            senderId: user.uid,
            senderName: user.email || 'Agent',
            createdAt: serverTimestamp(),
            imageUrls,
        };

        await addDoc(collection(db, 'chats', chatRoomId, 'messages'), messageData);

        const chatRef = doc(db, 'chats', chatRoomId);
        await updateDoc(chatRef, {
            lastMessage: newMessage || 'Sent an attachment',
            readBy: [user.uid], // Mark as read by sender
        });
        
        setNewMessage('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Could not send message.', variant: 'destructive'});
    } finally {
        setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((msg, index) => {
            const isSender = msg.senderId === user?.uid;
            const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
            return (
              <div key={msg.id} className={cn("flex items-end gap-2", isSender ? "justify-end" : "justify-start")}>
                {!isSender && (
                  <Avatar className={cn("h-8 w-8", !showAvatar && "invisible")}>
                    <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2", isSender ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {!isSender && showAvatar && <p className="text-xs font-bold mb-1">{msg.senderName}</p>}
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  {msg.imageUrls && (
                    <div className="mt-2 space-y-2">
                        {msg.imageUrls.map(url => (
                            <a href={url} target="_blank" rel="noopener noreferrer" key={url} className="block">
                               <Image src={url} alt="Uploaded image" width={200} height={200} className="rounded-md object-cover" />
                            </a>
                        ))}
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {msg.createdAt ? format(new Date(msg.createdAt.seconds * 1000), 'p') : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
         {file && (
          <div className="text-sm text-muted-foreground mb-2">
            Attachment: {file.name}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isSending}
          />
           <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Button onClick={handleSendMessage} disabled={isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
