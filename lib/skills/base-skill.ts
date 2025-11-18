/**
 * Base Skill Abstract Class
 *
 * Provides common functionality for all skills, reducing boilerplate
 * and ensuring consistent behavior across skill implementations.
 *
 * All concrete skills should extend this class.
 */

import type {
  Skill,
  SkillContext,
  SkillResult,
  SkillProgress,
  ValidationResult,
} from './types'
import {
  SkillExecutionError,
  SkillCancelledError,
  ValidationError as ValidationErrorType,
  FormulaValidationError,
  NotFoundError,
} from '@/lib/types/errors'
import {
  TONS_TO_YARDS,
  WEEKS_PER_MONTH,
  COMPACTOR_TARGET_TONS,
} from '@/lib/constants/formulas'

export abstract class BaseSkill<TResult = any> implements Skill<TResult> {
  /** Unique skill identifier */
  abstract readonly name: string

  /** Skill version (semantic versioning) */
  abstract readonly version: string

  /** Human-readable description */
  abstract readonly description: string

  /**
   * Main execution method - must be implemented by concrete skills
   *
   * This method should contain the core business logic of the skill.
   * Error handling, timing, and progress tracking are handled by the base class.
   *
   * @param context - Execution context
   * @returns Skill-specific result data
   */
  protected abstract executeInternal(context: SkillContext): Promise<TResult>

  /**
   * Optional validation method
   *
   * Override this to add skill-specific validation logic.
   * Default implementation checks for required data.
   *
   * @param context - Context to validate
   * @returns Validation result
   */
  async validate(context: SkillContext): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = []

    // Basic validation
    if (!context.projectId) {
      errors.push({
        field: 'projectId',
        message: 'Project ID is required',
        code: 'MISSING_PROJECT_ID',
      })
    }

    if (!context.userId) {
      errors.push({
        field: 'userId',
        message: 'User ID is required',
        code: 'MISSING_USER_ID',
      })
    }

    if (!context.project) {
      errors.push({
        field: 'project',
        message: 'Project data is required',
        code: 'MISSING_PROJECT_DATA',
      })
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Execute the skill with error handling, timing, and metadata
   *
   * This method wraps executeInternal with:
   * - Input validation
   * - Error handling
   * - Timing measurement
   * - Metadata collection
   * - Progress tracking
   *
   * @param context - Execution context
   * @returns Standardized skill result
   */
  async execute(context: SkillContext): Promise<SkillResult<TResult>> {
    const startTime = Date.now()
    const executedAt = new Date().toISOString()

    try {
      // Validate input
      const validation = await this.validate(context)
      if (!validation.valid) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validation.errors,
          },
          metadata: {
            skillName: this.name,
            skillVersion: this.version,
            durationMs: Date.now() - startTime,
            executedAt,
          },
        }
      }

      // Initial progress
      await this.updateProgress(context, {
        percent: 0,
        step: `Starting ${this.name}`,
        stepNumber: 0,
      })

      // Execute skill logic
      const result = await this.executeInternal(context)

      // Final progress
      await this.updateProgress(context, {
        percent: 100,
        step: 'Completed',
      })

      return {
        success: true,
        data: result,
        metadata: {
          skillName: this.name,
          skillVersion: this.version,
          durationMs: Date.now() - startTime,
          executedAt,
        },
      }
    } catch (error) {
      // Handle errors consistently
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      const errorCode =
        error instanceof SkillExecutionError
          ? error.code
          : 'EXECUTION_ERROR'

      return {
        success: false,
        data: null,
        error: {
          message: errorMessage,
          code: errorCode,
          details: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          skillName: this.name,
          skillVersion: this.version,
          durationMs: Date.now() - startTime,
          executedAt,
        },
      }
    }
  }

  /**
   * Helper method to update progress
   *
   * @param context - Execution context
   * @param progress - Progress update
   */
  protected async updateProgress(
    context: SkillContext,
    progress: SkillProgress
  ): Promise<void> {
    if (context.onProgress) {
      await context.onProgress(progress)
    }
  }

  /**
   * Helper method to check for cancellation
   *
   * @param context - Execution context
   * @throws {SkillCancelledError} If execution was cancelled
   */
  protected checkCancellation(context: SkillContext): void {
    if (context.signal?.aborted) {
      throw new SkillCancelledError(`${this.name} execution was cancelled`)
    }
  }

  /**
   * Helper method to validate formula consistency
   *
   * Ensures config values match canonical formulas.ts constants.
   * Override this if your skill doesn't use standard formulas.
   *
   * @param context - Execution context
   * @throws {FormulaValidationError} If formulas don't match
   */
  protected validateFormulas(context: SkillContext): void {
    const { config } = context

    // Use canonical values from formulas.ts
    if (config.conversionRates.compactorYpd !== TONS_TO_YARDS) {
      throw new FormulaValidationError(
        this.name,
        `Compactor YPD mismatch: expected ${TONS_TO_YARDS}, got ${config.conversionRates.compactorYpd}`
      )
    }

    if (config.conversionRates.dumpsterYpd !== WEEKS_PER_MONTH) {
      throw new FormulaValidationError(
        this.name,
        `Dumpster YPD mismatch: expected ${WEEKS_PER_MONTH}, got ${config.conversionRates.dumpsterYpd}`
      )
    }

    if (config.conversionRates.targetCapacity !== COMPACTOR_TARGET_TONS) {
      throw new FormulaValidationError(
        this.name,
        `Target capacity mismatch: expected ${COMPACTOR_TARGET_TONS}, got ${config.conversionRates.targetCapacity}`
      )
    }
  }
}
