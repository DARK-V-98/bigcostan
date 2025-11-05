
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Trash2, Mail, MailOpen, Loader2 } from 'lucide-react';

import { db } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: { seconds: number; nanoseconds: number; };
  read: boolean;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMessages = useCallback(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    const q = query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData: Message[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(messagesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      toast({ title: 'Error', description: 'Could not fetch contact messages.', variant: 'destructive' });
      setLoading(false);
    });
    return unsubscribe;
  }, [user, toast]);

  useEffect(() => {
    const unsubscribe = fetchMessages();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchMessages]);

  const handleDeleteClick = (message: Message) => {
    setSelectedMessage(message);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMessage || !user) {
        toast({ title: 'Error', description: 'No message selected or not authenticated.', variant: 'destructive' });
        return;
    }
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'contactSubmissions', selectedMessage.id));
      toast({ title: 'Success', description: 'Message deleted successfully.' });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({ title: 'Error', description: 'Could not delete message. Check permissions.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedMessage(null);
    }
  };
  
  const toggleReadStatus = async (message: Message) => {
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to update status.', variant: 'destructive' });
        return;
    }
    const messageRef = doc(db, 'contactSubmissions', message.id);
    try {
        await updateDoc(messageRef, { read: !message.read });
        toast({ title: 'Status Updated', description: `Message marked as ${!message.read ? 'read' : 'unread'}.`});
    } catch(error) {
        console.error('Error updating status:', error);
        toast({ title: 'Error', description: 'Could not update message status. Check permissions.', variant: 'destructive' });
    }
  }

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Contact Form Messages</CardTitle>
          <CardDescription>View messages submitted through the contact form.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border">
            <Table className="text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] p-2 sm:p-4">Status</TableHead>
                  <TableHead className="p-2 sm:p-4">Sender</TableHead>
                  <TableHead className="p-2 sm:p-4 hidden md:table-cell">Message</TableHead>
                  <TableHead className="p-2 sm:p-4 hidden lg:table-cell">Received</TableHead>
                  <TableHead className="text-right p-2 sm:p-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /><br/><Skeleton className="h-3 w-[180px] mt-1" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <TableRow key={message.id} className={cn(!message.read && 'bg-muted/50')}>
                      <TableCell className="p-2 sm:p-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => toggleReadStatus(message)}>
                                    {message.read ? <MailOpen className="h-5 w-5 text-muted-foreground" /> : <Mail className="h-5 w-5 text-primary" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mark as {message.read ? 'unread' : 'read'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                      </TableCell>
                      <TableCell className="font-medium p-2 sm:p-4">
                          <div className={cn('font-semibold', !message.read && 'text-foreground')}>{message.name}</div>
                          <div className="text-muted-foreground truncate">{message.email}</div>
                          {message.phone && <div className="text-muted-foreground">{message.phone}</div>}
                      </TableCell>
                      <TableCell className="max-w-[300px] whitespace-pre-wrap p-2 sm:p-4 hidden md:table-cell truncate">{message.message}</TableCell>
                      <TableCell className="p-2 sm:p-4 hidden lg:table-cell">
                        {message.createdAt ? format(new Date(message.createdAt.seconds * 1000), "PPpp") : 'N/A'}
                      </TableCell>
                       <TableCell className="text-right p-2 sm:p-4">
                         <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(message)} disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No messages yet.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
