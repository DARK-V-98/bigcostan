
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth, type Permission } from '@/context/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

type UserRole = 'admin' | 'developer' | 'user' | 'agent';
interface UserData {
  id: string;
  email: string;
  role: UserRole;
  permissions?: Permission[];
}

const allPermissions: { id: Permission, label: string}[] = [
    { id: 'overview', label: 'Dashboard Overview' },
    { id: 'roles', label: 'Role Management' },
    { id: 'messages', label: 'Contact Messages' },
    { id: 'events', label: 'Special Events' },
    { id: 'projects', label: 'Projects (All)' },
    { id: 'homes', label: 'Homes (All)' },
    { id: 'properties', label: 'Properties (All)' },
    { id: 'submissions', label: 'Property Submissions' },
];

export default function ManageRolesPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({ 
            id: doc.id, 
            email: data.email, 
            role: data.role,
            permissions: data.permissions || [],
        });
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Could not fetch user data.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, toast]);


  useEffect(() => {
    const unsubscribe = fetchUsers();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.uid) {
        toast({
            title: 'Action Forbidden',
            description: 'You cannot change your own role.',
            variant: 'destructive',
        });
        return;
    }
    
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, { role: newRole });
      toast({
        title: 'Role Updated!',
        description: `User role has been successfully changed to ${newRole}.`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update user role. Check permissions.',
        variant: 'destructive',
      });
    }
  };

  const handlePermissionChange = async (userId: string, permission: Permission, isChecked: boolean) => {
    setIsSubmitting(true);
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const currentPermissions = userToUpdate.permissions || [];
    const newPermissions = isChecked
      ? [...currentPermissions, permission]
      : currentPermissions.filter(p => p !== permission);

    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, { permissions: newPermissions });
      toast({
        title: 'Permissions Updated',
        description: `Permissions for ${userToUpdate.email} have been updated.`
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update permissions. Check Firestore rules.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const getRoleVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'developer': return 'secondary';
      case 'agent': return 'default';
      default: return 'outline';
    }
  };
  
  const agentsAndUsers = useMemo(() => {
    return users.filter(u => 
        (u.role === 'agent' || u.role === 'user') &&
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);


  return (
    <Tabs defaultValue="roles">
        <TabsList className="mb-6">
          <TabsTrigger value="roles">Manage Roles</TabsTrigger>
          <TabsTrigger value="permissions">Manage Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles">
            <Card className="rounded-2xl">
                <CardHeader>
                <CardTitle>User Role Management</CardTitle>
                <CardDescription>
                    View all registered users and assign their primary roles.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="rounded-2xl border">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead className="text-right">Change Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-10 w-[150px] ml-auto" /></TableCell>
                            </TableRow>
                        ))
                        ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                                <Badge variant={getRoleVariant(user.role)} className="capitalize">{user.role}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Select
                                defaultValue={user.role}
                                onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                                disabled={user.id === currentUser?.uid || user.role === 'developer'}
                                >
                                <SelectTrigger className="w-[180px] ml-auto">
                                    <SelectValue placeholder="Select new role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="agent">Agent</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    {currentUser?.email === 'thimira.vishwa2003@gmail.com' && user.email === 'thimira.vishwa2003@gmail.com' && <SelectItem value="developer">Developer</SelectItem>}
                                </SelectContent>
                                </Select>
                            </TableCell>
                            </TableRow>
                        ))
                        )}
                    </TableBody>
                    </Table>
                </div>
                {!loading && users.length === 0 && (
                    <p className="text-center text-muted-foreground mt-8">No users found.</p>
                )}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
           <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Detailed Permissions</CardTitle>
                    <CardDescription>
                       Grant specific dashboard access to Agents and Users. Admins and Developers have all permissions by default.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Input 
                            placeholder="Filter by user email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="rounded-2xl border">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Permissions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : agentsAndUsers.length > 0 ? (
                                    agentsAndUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium align-top">
                                                <div>{user.email}</div>
                                                <Badge variant={getRoleVariant(user.role)} className="capitalize mt-1">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {allPermissions.map(permission => (
                                                        <div key={permission.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`${user.id}-${permission.id}`}
                                                                checked={user.permissions?.includes(permission.id)}
                                                                onCheckedChange={(checked) => handlePermissionChange(user.id, permission.id, !!checked)}
                                                                disabled={isSubmitting}
                                                            />
                                                            <Label htmlFor={`${user.id}-${permission.id}`} className="text-sm font-normal">
                                                                {permission.label}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            No agents or users found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                         </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
