import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { POSLayout } from "@/components/layout/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users as UsersIcon, Plus, Search, Edit, Shield, UserCheck, UserX } from "lucide-react";
import { fetchUsers, addUser, updateUser, getCurrentUser } from "@/lib/api";
import { User } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";

const userSchema = z.object({
  name: z.string().min(2, { message: "Full name is required." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(["admin", "manager", "cashier"]),
});
type UserFormData = z.infer<typeof userSchema>;

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const activeUser = getCurrentUser();

  const { data: users = [], isLoading } = useQuery<User[], Error>({ queryKey: ["users"], queryFn: fetchUsers });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "cashier" }
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingUser) reset(editingUser);
      else reset({ name: "", username: "", email: "", role: "cashier" });
    } else {
      setEditingUser(null);
    }
  }, [isDialogOpen, editingUser, reset]);

  const userMutation = useMutation({
    mutationFn: (data: { userData: UserFormData, id?: string }) => {
        const payload = data.id 
            ? { ...editingUser!, ...data.userData } as User
            : { ...data.userData, isActive: true } as Omit<User, 'id'>;
        return data.id ? updateUser(payload as User) : addUser(payload);
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success!", description: `User has been ${variables.id ? 'updated' : 'created'}.` });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  
  const toggleStatusMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
        toast({title: "Status Updated", description: `${updatedUser.name} is now ${updatedUser.isActive ? 'active' : 'inactive'}.`});
        queryClient.invalidateQueries({queryKey: ['users']});
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const onSubmit = (data: UserFormData) => {
    userMutation.mutate({ userData: data, id: editingUser?.id });
  };
  
  const toggleUserStatus = (user: User) => {
    if (user.id === activeUser?.id) {
        toast({ title: "Action Forbidden", description: "You cannot deactivate your own account.", variant: "destructive" });
        return;
    }
    toggleStatusMutation.mutate({ ...user, isActive: !user.isActive });
  };

  const filteredUsers = useMemo(() =>
    users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())),
  [users, searchTerm]);

  if (isLoading) return <LoadingScreen message="Loading users..." />;

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold">User Management</h1><p className="text-muted-foreground">Manage accounts and permissions</p></div>
          {activeUser?.role === 'admin' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/>Add User</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" {...register("username")} />
                    {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Controller name="role" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cashier">Cashier</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={userMutation.isPending}>{userMutation.isPending ? <LoadingSpinner size="sm"/> : "Save"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
            <div className="relative max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/></div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell><div>{user.name}<div className="text-sm text-muted-foreground">{user.email}</div></div></TableCell>
                    <TableCell><Badge>{user.role}</Badge></TableCell>
                    <TableCell><Badge variant={user.isActive ? 'default' : 'destructive'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} disabled={activeUser?.role !== 'admin'}><Edit className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleUserStatus(user)} disabled={user.id === activeUser?.id || activeUser?.role !== 'admin' || toggleStatusMutation.isPending}>
                        {user.isActive ? <UserX className="h-4 w-4 text-red-500"/> : <UserCheck className="h-4 w-4 text-green-500"/>}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}