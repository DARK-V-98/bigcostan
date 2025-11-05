
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-provider';
import { db, storage } from '@/lib/firebase-client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { formatRelative } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ChatInterface from '@/components/chat-interface';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


export interface ChatRoom {
  id: string;
  userEmail: string;
  lastMessage: string;
  createdAt: any;
  submissionId: string;
  readBy: string[];
}

export default function MyChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/auth');
        return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'chats'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChatRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom)));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router]);
  
  const handleSelectChat = async (chat: ChatRoom) => {
      setSelectedChat(chat);
      if (user && !chat.readBy.includes(user.uid)) {
          const chatRef = doc(db, 'chats', chat.id);
          await updateDoc(chatRef, {
              readBy: [...chat.readBy, user.uid]
          });
      }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto py-10 px-4">
          <Skeleton className="h-8 w-1/4 mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card className="rounded-2xl">
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
                <Card className="rounded-2xl h-[70vh]">
                     <CardContent className="p-6 flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading chats...</p>
                    </CardContent>
                </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-10 px-4">
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-6">My Chats</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                {chatRooms.length > 0 ? (
                  <div className="space-y-2">
                    {chatRooms.map(chat => {
                      const isUnread = user && !chat.readBy.includes(user.uid);
                      return(
                        <button
                          key={chat.id}
                          onClick={() => handleSelectChat(chat)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg transition-colors",
                            selectedChat?.id === chat.id ? 'bg-primary/20' : 'hover:bg-muted',
                            isUnread && "font-bold"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="overflow-hidden">
                                <p className="truncate text-sm font-semibold">Property Submission</p>
                                <p className="truncate text-xs text-muted-foreground">{chat.lastMessage}</p>
                            </div>
                            {isUnread && <Badge className="ml-2 flex-shrink-0">New</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {chat.createdAt ? formatRelative(new Date(chat.createdAt.seconds * 1000), new Date()) : '...'}
                          </p>
                        </button>
                    )})}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground p-4">You have no active chats.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="rounded-2xl h-[70vh]">
              {selectedChat ? (
                <ChatInterface chatRoomId={selectedChat.id} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Select a conversation to start chatting.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
