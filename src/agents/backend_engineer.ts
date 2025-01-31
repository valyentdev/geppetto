import { CoreMessage, tool, Tool } from 'ai'
import { z } from 'zod'
import { Worker } from './agent.js'
import { cwd } from 'node:process'

export default class BackendEngineer extends Worker {
  public role: string = 'Backend Engineer (AdonisJS v6)'
  public goal: string = `Your goal is to:
  1. Implement controllers and services
  2. Define and secure routes
  3. Create middleware and validators
  4. Handle business logic and data processing`
  public knowledge: string = `
Example controller:
\`\`\`
// ./app/controllers/posts_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
import { createPostValidator } from '#validators/post'
import string from '

export default class PostsController {
  async index({ inertia }: HttpContext) {
    const posts = await Post.query()
      .orderBy('created_at', 'desc')
    return inertia.render('posts/index', { posts })
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createPostValidator)
    const post = await Post.create(payload)
    return response.redirect().toRoute('posts.show', { id: post.id })
  }
}
\`\`\`

Example validator:
\`\`\`
// ./app/validators/post.ts
import vine from '@vinejs/vine'

/**
 * Validates the post's creation action
 */
export const createPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    slug: vine.string().trim(),
    description: vine.string().trim().escape()
  })
)

/**
 * Validates the post's update action
 */
export const updatePostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    description: vine.string().trim().escape()
  })
)
\`\`\``
  public tools: Record<string, Tool> = {
    scaffoldController: tool({
      description: 'Scaffold a new controller for handling HTTP requests',
      parameters: z.object({
        name: z.string(),
        isResource: z.boolean().optional(),
      }),
      execute: async ({ name, isResource }) => {
        return this.scaffold({
          resource: 'controller',
          name,
          flags: isResource ? '--resource' : undefined,
        })
      },
    }),
    scaffoldValidator: tool({
      description: 'Scaffold a new validator for validating request payloads (using VineJS)',
      parameters: z.object({
        name: z.string(),
        isResource: z.boolean().optional(),
      }),
      execute: async ({ name, isResource }) => {
        return this.scaffold({
          resource: 'validator',
          name,
          flags: isResource ? '--resource' : undefined,
        })
      },
    }),
    scaffoldEvent: tool({
      description: 'Create a new AdonisJS V6 event class',
      parameters: z.object({
        name: z.string(),
      }),
      execute: async ({ name }) => {
        return this.scaffold({ resource: 'event', name })
      },
    }),
    scaffoldListener: tool({
      description: 'Create a new AdonisJS V6 event listener class',
      parameters: z.object({
        name: z.string(),
      }),
      execute: async ({ name }) => {
        return this.scaffold({ resource: 'listener', name })
      },
    }),
    scaffoldService: tool({
      description: 'Create a new AdonisJS V6 service class',
      parameters: z.object({
        name: z.string(),
      }),
      execute: async ({ name }) => {
        return this.scaffold({ resource: 'service', name })
      },
    }),
  }

  async work(messages?: CoreMessage[]) {
    /**
     * List files in ./app directory
     */
    const { stdout: listOfFiles } = await this.executeCommand('tree', {
      cwd: cwd() + '/app',
    })

    /**
     * Add this list of files to knowledge
     */
    this.knowledge += `Here is a list of relevant files for the backend engineer,
located in the ./app directory: "${listOfFiles}".`

    return super.work(messages)
  }
}
