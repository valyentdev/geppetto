import { generateObject } from 'ai'
import { Agent } from './agent.js'
import { z } from 'zod'

export default class ProjectManager extends Agent {
  public role: string = 'Project Manager'
  public goal: string = `You are a project manager specialized in managing AdonisJS 6 full-stack applications.
Your role is to:
1. Coordinate work between specialized agents (PO, DB specialist, Backend, Frontend)
2. Ensure architectural consistency
3. Maintain project timeline and dependencies

When working:
- First analyze requirements and create a plan
- Delegate specific tasks to appropriate specialists`

  constructor(public knowledge: string = '') {
    super()
  }

  public async plan(prompt: string) {
    return generateObject({
      model: this.model,
      schema: z.object({
        tasks: z.array(
          z.object({
            worker: z.enum(['Backend Engineer', 'Database Specialist']),
            instructions: z.string(),
          })
        ),
      }),
      system: this.fullDescription,
      prompt,
    })
  }
}
