import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your content management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Posts</CardTitle>
            <CardDescription>
              Manage your blog posts and articles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href="/admin/posts" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View all posts →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Organize your content with categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href="/admin/categories" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage categories →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Tag your content for better organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href="/admin/tags" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage tags →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}