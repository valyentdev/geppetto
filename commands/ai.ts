import { BaseCommand } from '@adonisjs/core/ace'
import BackendEngineer from '../src/agents/backend_engineer.js'
import DatabaseSpecialist from '../src/agents/database_specialist.js'
import { CoreMessage } from 'ai'
import ProjectManager from '../src/agents/project_manager.js'
import FrontendDeveloper from '../src/agents/frontend_developer.js'

export default class AI extends BaseCommand {
  static commandName = 'ai'

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const prompt = await this.prompt.ask('What do you want to do?')

    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ]

    const workers = {
      'Database Specialist': new DatabaseSpecialist(),
      'Backend Engineer': new BackendEngineer(),
      'Frontend Developer': new FrontendDeveloper(),
    }

    const projectManager = new ProjectManager(
      `[Database Specialist Goal: "${workers['Database Specialist'].goal}"]` +
        `[Backend Engineer Goal: "${workers['Backend Engineer'].goal}"]` +
        `[Frontend Developer Goal: "${workers['Frontend Developer'].goal}"]`
    )
    const {
      object: { tasks },
    } = await projectManager.plan(prompt)
    for (const task of tasks) {
      this.logger.info(
        `[${task.worker}] executing task with instructions: "${task.instructions}" ...`
      )

      messages.push({
        role: 'assistant',
        content: workers[task.worker].fullDescription,
      })
      messages.push({
        role: 'assistant',
        content: `[Project Manager to ${task.worker}] Here are your instructions: "${task.instructions}"`,
      })
      const result = await workers[task.worker].work(messages)
      messages.push(...result.response.messages)
      this.logger.info(`[${task.worker}] finished his hard work!`)
    }
  }
}
