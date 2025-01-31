import { CoreMessage, generateText, tool, Tool } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { promisify } from 'node:util'
import { exec, ExecOptions } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { cwd } from 'node:process'
import { readFileSync } from 'node:fs'

export abstract class Agent {
  public abstract role: string
  public abstract goal: string
  public abstract knowledge: string

  protected get model() {
    /**
     * Determiner which LLM model to use
     */
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    const model = anthropic('claude-3-5-sonnet-latest')

    return model
  }

  public get fullDescription() {
    return `[Role: "${this.role}] [Goal: "${this.goal}] [Knowledge: "${this.knowledge}]"`
  }

  protected async executeCommand(cmd: string, options?: ExecOptions) {
    return await promisify(exec)(cmd, options)
  }

  protected async scaffold({
    resource,
    name,
    flags,
  }: {
    resource: string
    name: string
    flags?: string
  }) {
    let cmd = `node ace make:${resource} ${name}`
    if (flags) {
      cmd += ' ' + flags
    }
    const { stdout, stderr } = await promisify(exec)(cmd)
    if (stderr) {
      return { stderr }
    }
    const filePath = stdout
      .split('create ')[1]
      .replace('DONE:', '')
      .replace('(File already exists)', '')
      .trim()
    const file = readFileSync(cwd() + '/' + filePath, {
      encoding: 'utf-8',
    })
    const contents = file.toString()
    return { filePath, contents }
  }
}

export abstract class Worker extends Agent {
  public abstract tools: Record<string, Tool>

  private commonTools: Record<string, Tool> = {
    executeCommand: tool({
      description: 'Execute a command, e.g: node ace list:routes',
      parameters: z.object({
        cmd: z.string(),
      }),
      execute: ({ cmd }) => this.executeCommand(cmd),
    }),
    writeFile: tool({
      description: 'Write text content to a file. Make sure that you pass the whole contents.',
      parameters: z.object({
        path: z.string(),
        contents: z.string(),
      }),
      execute: async ({ path, contents }) => {
        await writeFile(cwd() + '/' + path, contents)
      },
    }),
    readFile: tool({
      description: 'Read text content from a file. Make sure that you pass the correct path.',
      parameters: z.object({
        path: z.string(),
      }),
      execute: async ({ path }) => {
        const file = await readFile(path)
        return {
          fileContents: file.toString(),
        }
      },
    }),
  }

  async work(messages?: CoreMessage[]) {
    /**
     * Call the LLM model
     */
    return generateText({
      model: this.model,
      messages,
      tools: {
        ...this.commonTools,
        ...this.tools,
      },
      maxSteps: 10,
      maxRetries: 1,
      toolChoice: 'required',
      onStepFinish(event) {
        console.log(`Step Finished [${event.stepType}]`, event.text)
      },
    })
  }
}
