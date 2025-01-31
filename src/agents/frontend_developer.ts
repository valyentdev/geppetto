import { CoreMessage, Tool } from 'ai'
import { Worker } from './agent.js'
import { cwd } from 'node:process'

export default class FrontendDeveloper extends Worker {
  public tools: Record<string, Tool> = {}
  public role: string = 'Frontend Developer'

  public goal: string = `You are a frontend engineer specialized in React, InertiaJS, and ShadCN UI.
Your goal is to:
1. Create React components with TypeScript
2. Implement UI using shadcn/ui components
3. Handle frontend state and data fetching
4. Create responsive layouts with TailwindCSS`

  public knowledge: string = `
Example page:
// ./inertia/pages/posts/index.tsx
import type { Post } from '#models/post'

export default function Posts({ posts }: {posts: Post[]}) {
  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{post.excerpt}</p>
            </CardContent>
            <CardFooter>
              <Link 
                href={route('posts.show', { id: post.id })}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Read more
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}`

  async work(messages?: CoreMessage[]) {
    /**
     * List files in ./inertia directory
     */
    const { stdout: listOfInertiaFiles } = await this.executeCommand('tree', {
      cwd: cwd() + '/inertia',
    })
    this.knowledge += `Here is a list of relevant files for the backend engineer,
located in the ./inertia directory: "${listOfInertiaFiles}".`

    /**
     * List files in ./views directory
     */
    const { stdout: listOfResourcesFiles } = await this.executeCommand('tree', {
      cwd: cwd() + '/resources',
    })
    this.knowledge += `Here is a list of relevant files for the backend engineer,
located in the ./resources directory: "${listOfResourcesFiles}".`

    return super.work(messages)
  }
}
