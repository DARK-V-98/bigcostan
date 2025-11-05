
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-provider';
import { db } from '@/lib/firebase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { formatRelative } from 'date-fns';
import ChatInterface from '@/components/chat-interface';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export interface Submission {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  userId: string;
  userEmail: string;
  status: 'pending' | 'reviewed' | 'closed';
  createdAt: any;
}

export interface ChatRoom {
  id: string;
  userId: string;
  userEmail: string;
  lastMessage: string;
  createdAt: any;
  submissionId: string;
  readBy: string[];
}

export default function SubmissionsPage() {
  const { user, loading: authLoading, permissions } = useAuth();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || !permissions.includes('submissions')) {
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    const chatQuery = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));
    const subQuery = query(collection(db, 'propertySubmissions'));

    const unsubChats = onSnapshot(chatQuery, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom)));
    });
    
    const unsubSubs = onSnapshot(subQuery, (snapshot) => {
        const subs: Record<string, Submission> = {};
        snapshot.forEach(doc => {
            subs[doc.id] = { id: doc.id, ...doc.data() } as Submission;
        });
        setSubmissions(subs);
        setLoading(false);
    });

    return () => {
      unsubChats();
      unsubSubs();
    }
  }, [user, authLoading, router, permissions]);
  
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
      <>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Property Submissions</h2>
        </div>
         <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="rounded-2xl h-[70vh]">
              <CardContent className="p-6 flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading submissions...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Property Submissions</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent>
              {chats.length > 0 ? (
                <div className="space-y-2">
                  {chats.map(chat => {
                    const submission = submissions[chat.submissionId];
                    const isUnread = user && !chat.readBy.includes(user.uid);
                    return (
                      <button
                        key={chat.id}
                        onClick={() => handleSelectChat(chat)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors",
                          selectedChat?.id === chat.id ? 'bg-primary/20' : 'hover:bg-muted',
                          isUnread && 'bg-blue-500/10'
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className="overflow-hidden">
                            <p className={cn("truncate text-sm font-semibold", isUnread && "font-bold")}>{submission?.title || 'Untitled Submission'}</p>
                            <p className="text-xs text-muted-foreground">from: {chat.userEmail}</p>
                            <p className="truncate text-xs text-muted-foreground mt-1">{chat.lastMessage}</p>
                          </div>
                           {isUnread && <Badge className="ml-2 flex-shrink-0">New</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {chat.createdAt ? formatRelative(new Date(chat.createdAt.seconds * 1000), new Date()) : '...'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-4">No submissions yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card className="rounded-2xl h-[70vh]">
            {selectedChat ? (
              <ChatInterface chatRoomId={selectedChat.id} />
            ) : (
              <div className="h-full flex items-center justify-center p-4 text-center">
                <p className="text-muted-foreground">Select a submission to view the conversation.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
