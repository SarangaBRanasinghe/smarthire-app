'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Search,
  MoreVertical,
  Users,
  Building2,
  UserCircle,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  Edit,
  Filter,
  Download,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

// Mock data for users
const mockUsers = [
  {
    id: '1',
    email: 'john.smith@email.com',
    fullName: 'John Smith',
    role: 'job_seeker' as UserRole,
    status: 'active',
    createdAt: '2024-01-15',
    lastLogin: '2024-01-20',
  },
  {
    id: '2',
    email: 'sarah.j@company.com',
    fullName: 'Sarah Johnson',
    role: 'recruiter' as UserRole,
    status: 'active',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-19',
  },
  {
    id: '3',
    email: 'mike.chen@email.com',
    fullName: 'Mike Chen',
    role: 'job_seeker' as UserRole,
    status: 'active',
    createdAt: '2024-01-12',
    lastLogin: '2024-01-18',
  },
  {
    id: '4',
    email: 'emily.b@techcorp.com',
    fullName: 'Emily Brown',
    role: 'recruiter' as UserRole,
    status: 'suspended',
    createdAt: '2024-01-05',
    lastLogin: '2024-01-10',
  },
  {
    id: '5',
    email: 'alex.kumar@email.com',
    fullName: 'Alex Kumar',
    role: 'job_seeker' as UserRole,
    status: 'active',
    createdAt: '2024-01-08',
    lastLogin: '2024-01-17',
  },
  {
    id: '6',
    email: 'admin@smarthire.com',
    fullName: 'System Admin',
    role: 'admin' as UserRole,
    status: 'active',
    createdAt: '2023-12-01',
    lastLogin: '2024-01-20',
  },
]

const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  job_seeker: {
    label: 'Job Seeker',
    icon: <UserCircle className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-700',
  },
  recruiter: {
    label: 'Recruiter',
    icon: <Building2 className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-700',
  },
  admin: {
    label: 'Admin',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-700',
  },
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const stats = {
    totalUsers: mockUsers.length,
    jobSeekers: mockUsers.filter((u) => u.role === 'job_seeker').length,
    recruiters: mockUsers.filter((u) => u.role === 'recruiter').length,
    admins: mockUsers.filter((u) => u.role === 'admin').length,
  }

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleSuspendUser = (user: typeof mockUsers[0]) => {
    toast.success(`${user.fullName} has been ${user.status === 'active' ? 'suspended' : 'activated'}`)
  }

  const handleDeleteUser = () => {
    toast.success(`${selectedUser?.fullName} has been deleted`)
    setIsDeleteDialogOpen(false)
    setSelectedUser(null)
  }

  const handleUpdateUser = () => {
    toast.success(`${selectedUser?.fullName}'s profile has been updated`)
    setIsEditDialogOpen(false)
    setSelectedUser(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">
            Manage all users, roles, and permissions
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Users
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <UserCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.jobSeekers}</p>
              <p className="text-sm text-gray-500">Job Seekers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.recruiters}</p>
              <p className="text-sm text-gray-500">Recruiters</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="job_seeker">Job Seekers</SelectItem>
                <SelectItem value="recruiter">Recruiters</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {user.fullName.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${roleConfig[user.role].color} flex w-fit items-center gap-1`}>
                      {roleConfig[user.role].icon}
                      {roleConfig[user.role].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {user.status === 'active' ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Ban className="mr-1 h-3 w-3" />
                      )}
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(user.lastLogin)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSuspendUser(user)}>
                          {user.status === 'active' ? (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend User
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate User
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <Input defaultValue={selectedUser.fullName} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input defaultValue={selectedUser.email} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Select defaultValue={selectedUser.role}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job_seeker">Job Seeker</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleUpdateUser}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.fullName}? This action cannot
              be undone and will permanently remove all user data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
