import { CoreMessage, tool, Tool } from 'ai'
import { Worker } from './agent.js'
import { z } from 'zod'
import { writeFile } from 'node:fs/promises'
import { cwd } from 'node:process'

export default class DatabaseSpecialist extends Worker {
  public role: string = 'Database Specialist (AdonisJS v6 with Lucid)'
  public goal: string = `Your goal is to:
  1. Design database schemas
  2. Create migrations using the latest AdonisJS 6 syntax, and setting relationships
  3. Define Lucid models with relationships!!!
  4. Implement database-level validations`
  public knowledge: string = `Example migration:
\`\`\`
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'posts'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
        table.increments('id')
        table.string('title').notNullable()
        table.text('content')
        table.integer('user_id').unsigned().references('id').inTable('users')
        table.timestamp('published_at', { useTz: true })
        table.timestamp('created_at', { useTz: true })
        table.timestamp('updated_at', { useTz: true })
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
\`\`\`

Example model:
\`\`\`
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Post extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare title: string

    @column()
    declare content: string

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>
}
\`\`\``

  private scaffoldedMigrationPath?: string

  public tools: Record<string, Tool> = {
    scaffoldModel: tool({
      description: 'Scaffold a new AdonisJS v6 Lucid database model.',
      parameters: z.object({
        modelName: z.string(),
      }),
      execute: async ({ modelName }) => {
        return this.scaffold({
          resource: 'model',
          name: modelName,
        })
      },
    }),
    scaffoldMigration: tool({
      description: `Scaffold a new AdonisJS v6 Lucid database migration.
After you scaffold a migration, make sure to complete it!!!`,
      parameters: z.object({
        migrationName: z.string(),
        type: z.enum(['create', 'alter']),
      }),
      execute: async ({ migrationName, type }) => {
        const { contents: migrationFileContents, filePath } = await this.scaffold({
          resource: 'migration',
          name: migrationName,
          flags: '--' + type,
        })

        console.log('scaffoldedMigrationPath', filePath)
        this.scaffoldedMigrationPath = filePath

        return { migrationFileContents }
      },
    }),
    completeAlreadyScaffoldedMigration: tool({
      description: `Complete a newly scaffolded migration file.
This should only be used after a migration is scaffolded.`,
      parameters: z.object({
        contents: z.string(),
      }),
      execute: async ({ contents }) => {
        if (!this.scaffoldedMigrationPath) {
          throw new Error('No scaffolded migration found...')
        }
        await writeFile(cwd() + '/' + this.scaffoldedMigrationPath, contents)
      },
    }),
    runMigrations: tool({
      description: 'Run AdonisJS V6 Lucid migrations',
      parameters: z.object({}),
      execute: async () => {
        return this.executeCommand('node ace migration:run')
      },
    }),
    freshMigrations: tool({
      description: 'Fresh AdonisJS V6 Lucid migrations',
      parameters: z.object({}),
      execute: async () => {
        return this.executeCommand('node ace migration:fresh')
      },
    }),
  }

  async work(messages?: CoreMessage[]) {
    /**
     * List files in ./database directory
     */
    const { stdout: listOfFilesInDatabaseDir } = await this.executeCommand('tree', {
      cwd: cwd() + '/database',
    })
    this.knowledge += `Here is a list of relevant files for the database specialist,
located in the ./database directory: "${listOfFilesInDatabaseDir}".`

    /**
     * List files in ./app/models directory
     */
    const { stdout: listOfFilesInModelsDir } = await this.executeCommand('tree', {
      cwd: cwd() + '/app/models',
    })
    this.knowledge += `Here is a list of relevant files for the database specialist,
located in the ./app/models directory: "${listOfFilesInModelsDir}".`

    return super.work(messages)
  }
}
