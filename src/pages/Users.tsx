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
import { fetchUsers, addUser, updateUser } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { User } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";

// Corrected Zod schema for the user form
const userSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["admin", "manager", "cashier"]),
  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
});

type UserFormData = z.infer<typeof userSchema>;

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: activeUser } = useAuth();

  const { data: users = [], isLoading, isError, error } = useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "cashier" },
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingUser) {
        reset({ ...editingUser, password: '' });
      } else {
        reset({ name: "", username: "", email: "", role: "cashier", password: "" });
      }
    } else {
      setEditingUser(null);
    }
  }, [isDialogOpen, editingUser, reset]);

  const userMutation = useMutation({
    mutationFn: (formData: UserFormData) => {
      if (editingUser) {
        // For updates, we merge form data with existing user data.
        // Password field is ignored unless implemented in the form for updates.
        const { password, ...updateData } = formData;
        return updateUser({ ...editingUser, ...updateData });
      } else {
        // For adding, we construct the full payload addUser expects.
        if (!formData.password) throw new Error("Password is required for new users.");
        const newUserPayload = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          isActive: true, // This was the missing property
          password: formData.password,
        };
        return addUser(newUserPayload);
      }
    },
    onSuccess: () => {
      toast({ title: "Success!", description: `User has been ${editingUser ? 'updated' : 'created'}.` });
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
    userMutation.mutate(data);
  };
  
  const handleToggleStatus = (user: User) => {
    if (user.id === activeUser?.id) {
      toast({ title: "Action Forbidden", description: "You cannot deactivate your own account.", variant: "destructive" });
      return;
    }
    toggleStatusMutation.mutate({ ...user, isActive: !user.isActive });
  };

  const filteredUsers = useMemo(() =>
    users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
  
  if (isLoading) return <LoadingScreen message="Loading users..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
            {activeUser?.role === 'admin' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4"/>Add User</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <fieldset disabled={userMutation.isPending} className="space-y-3">
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
                        <Label htmlFor="email">Email (for login)</Label>
                        <Input id="email" type="email" {...register("email")} />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                      </div>
                      {!editingUser && (
                          <div className="space-y-1">
                              <Label htmlFor="password">Password</Label>
                              <Input id="password" type="password" {...register("password")} />
                              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                          </div>
                      )}
                       <div className="space-y-1">
                          <Label>Role</Label>
                          <Controller name="role" control={control} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="cashier">Cashier</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                          </Select>
                          )} />
                      </div>
                    </fieldset>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={userMutation.isPending}>Cancel</Button>
                      <Button type="submit" disabled={userMutation.isPending}>{userMutation.isPending ? <LoadingSpinner size="sm"/> : "Save User"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
        </div>
        
        <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell><div><span className="font-medium">{user.name}</span>{user.id === activeUser?.id && <Badge variant="outline" className="ml-2">You</Badge>}</div></TableCell>
                                <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                                <TableCell><Badge className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                <TableCell>
                                    {activeUser?.role === 'admin' && user.id !== activeUser?.id && (
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => {setEditingUser(user); setIsDialogOpen(true);}}><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)} disabled={toggleStatusMutation.isPending}>{user.isActive ? <UserX className="h-4 w-4 text-red-500"/> : <UserCheck className="h-4 w-4 text-green-500"/>}</Button>
                                        </div>
                                    )}
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