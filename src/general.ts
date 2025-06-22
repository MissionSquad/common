import { Buffer } from 'buffer'
import crypto from 'crypto'
import { nanoid } from 'nanoid'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Logs a message to the console with a specified log level and optional error.
 *
 * @description Logs a message to the console with a timestamp, log level, and message. 
 * If an error is provided, it will be logged as an error.
 *
 * @param {Object} options - Log options
 * @param {string} options.level - The log level (e.g., 'info', 'error', etc.)
 * @param {string} options.msg - The log message
 * @param {*} [options.error] - An optional error to log
 *
 * @returns {void}
 */
export function log({ level, msg, error }: { level: string, msg: string, error?: any }, useConsoleError: boolean = false): void {
  const logFunction = useConsoleError ? console.error : console.log
  logFunction(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}`)
  if (error != null) {
    logFunction(error)
  }
}

/**
 * Generates a random ID using nanoid, falling back to simpleRandomId if nanoid returns null.
 *
 * @description Provides a reliable way to generate unique IDs by attempting to use nanoid first,
 * and resorting to simpleRandomId as a backup in case of failure.
 *
 * @param {number} [length=21] The desired length of the generated ID. Defaults to 21 if not provided.
 * 
 * @returns {string} A randomly generated ID.
 */
export function randomId(length: number = 21): string {
  const id = nanoid(length)
  return id
}

/**
 * Pauses execution for a specified amount of time.
 *
 * @description Creates a new Promise that resolves after the specified number of milliseconds.
 *
 * @param {number} ms The number of milliseconds to pause execution.
 *
 * @returns {Promise<void>} A promise that resolves when the sleep period has ended.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retries a function with exponential backoff in case of failure.
 *
 * @description Executes the provided function, and if it fails, retries it after a certain delay. The delay increases exponentially with each attempt.
 * If all attempts fail, logs an error message.
 *
 * @param {function} fn - The function to be executed.
 * @param {function} [onRetry] - An optional function to be called before each retry.
 * @param {number} [maxAttempts=5] - The maximum number of attempts.
 * @param {number} [baseDelayMs=500] - The base delay in milliseconds.
 *
 * @returns {Promise<any>} A promise that resolves with the result of the executed function, or an object containing an error if all attempts fail.
 */
export function retryWithExponentialBackoff(
  fn: (...args: any) => Promise<any>,
  onRetry: () => any = () => null,
  maxAttempts: number = 5,
  baseDelayMs: number = 500
): Promise<any> {
  let attempt = 1

  const execute = async (): Promise<any> => {
    try {
      return await fn()
    } catch (error) {
      if (attempt >= maxAttempts) {
        // throw error
        log({ level: 'error', msg: 'Max attempts reached', error })
        return { error }
      }

      const delayMs = baseDelayMs * 2 ** attempt
      log({ level: 'warn', msg: `Retry attempt ${attempt} after ${delayMs}ms` })
      try {
        onRetry()
      } catch (error) {
        log({ level: 'error', msg: 'could not execute onRetry', error })
      }
      await sleep(delayMs)

      attempt++
      return execute()
    }
  }

  return execute()
}

/**
 * Creates a SHA-1 hash from the provided data.
 *
 * @description Takes an object or string, converts it to a JSON string if necessary,
 * and then generates a SHA-1 hash using the Web Crypto API. The resulting hash is
 * returned as a hexadecimal string.
 *
 * @param {Object | string} data - The input data to be hashed.
 *
 * @returns {Promise<string>} A promise that resolves with the SHA-1 hash of the input data.
 */
export async function createHash(data: Object | string): Promise<string> {
  const stringValue = typeof data === 'string' ? data : JSON.stringify(data)
  const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(stringValue))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generates an MD5 hash from the provided data.
 *
 * @description Converts the input data to a string (if it's not already) and then uses the crypto library to generate an MD5 hash.
 *
 * @param {Object | string} data The data to be hashed. Can be either an object or a string.
 *
 * @returns {string} A hexadecimal representation of the MD5 hash.
 */
export function md5(data: Object | string): string {
  const stringValue = typeof data === 'string' ? data : JSON.stringify(data)
  return crypto
    .createHash('md5')
    .update(stringValue)
    .digest('hex')
}

/**
 * Converts an object to a base64-encoded string.
 *
 * @description Takes an input object, converts it to a JSON string, and then encodes the string in base64 format.
 *
 * @param {Object} input - The object to be converted to base64.
 *
 * @returns {string} A base64-encoded string representation of the input object.
 */
export function objectToBase64(input: Object): string {
  const jsonString = JSON.stringify(input)
  return Buffer.from(jsonString, 'utf8').toString('base64')
}

/**
 * Converts a base64-encoded string to an object of type T.
 *
 * @description Decodes the base64 string, parses it as JSON, and returns the resulting object.
 *
 * @param {string} base64 - The base64-encoded string to convert.
 *
 * @returns {T} The decoded object of type T.
 */
export function base64ToObject<T>(base64: string): T {
  const jsonString = Buffer.from(base64, 'base64').toString('utf8')
  return JSON.parse(jsonString) as T
}

/**
 * Extracts code blocks from a given text based on provided patterns.
 *
 * @description Iterates over each pattern, creates a regular expression to match the start and stop of the block,
 * and extracts the content within. The extracted blocks are then returned as an array.
 *
 * @param {string} text - The input text to extract code blocks from.
 * @param {{ start: string; stop: string }[]} patterns - An array of objects containing the start and stop patterns for each code block.
 *
 * @returns {string[]} An array of extracted code blocks.
 */
export function extractCodeBlocks(text: string, patterns: { start: string; stop: string }[]): string[] {
  return patterns.flatMap(({ start, stop }) => {
    const modifiedStart = `${start}\\w*\\s*`
    const regex = new RegExp(`${modifiedStart}(.*?)${stop}`, 'gs')

    return [...text.matchAll(regex)].map((match) => match[1].trim())
  })
}

/**
 * Splits text into chunks of code and non-code blocks based on a given pattern.
 *
 * @description This function takes in a string of text and an object with start and stop patterns,
 *              then splits the text into chunks where each chunk is either a code block or non-code text.
 *              The code blocks are identified by the start and stop patterns, which can include an optional language specifier.
 *
 * @param {string} text - The input text to be split into chunks.
 * @param {{ start: string; stop: string }} pattern - An object containing the start and stop patterns for code blocks.
 *
 * @returns {{ text: string; code: boolean; language?: string }[]} An array of objects, where each object represents a chunk of text.
 *              Each object has three properties: 'text' (the actual text), 'code' (a boolean indicating whether the text is a code block),
 *              and 'language' (an optional string specifying the language of the code block).
 */
export function splitTextIntoChunks(
  text: string,
  pattern: { start: string; stop: string }
): { text: string; code: boolean; language?: string }[] {
  // Construct a regex that matches code blocks with an optional language specifier
  const modifiedStart = `${pattern.start}(\\w*)\\s*`
  const regex = new RegExp(`${modifiedStart}((?:.|\\n)*?)${pattern.stop}`, 'gs')

  let lastIndex = 0
  let result = []

  // Extract all code blocks and intersperse them with non-code text
  text.replace(regex, (match, language, capturedContent, offset) => {
    // Capture text before the code block
    if (offset > lastIndex) {
      result.push({ text: text.substring(lastIndex, offset), code: false })
    }
    // Capture the code block, excluding the start and stop patterns, and include the language
    result.push({ text: capturedContent.trim(), code: true, language: language.trim() || undefined })
    lastIndex = offset + match.length
    return match // Necessary to keep replace function working
  })

  // Capture any remaining text after the last code block
  if (lastIndex < text.length) {
    result.push({ text: text.substring(lastIndex), code: false })
  }

  return result
}

/**
 * Parses text into chunks based on predefined patterns, identifying code blocks.
 *
 * @description Iterates through an array of patterns to split the input text into chunks,
 * where each chunk is either a code block or plain text. The function stops at the first
 * pattern that results in more than one chunk or a single code chunk.
 *
 * @param {string} text - The input text to be parsed.
 *
 * @returns {{ code: boolean; text: string; language?: string }[]} An array of objects,
 * where each object represents a chunk of the input text, containing properties 'code',
 * 'text', and optionally 'language'.
 */
export function parseText(text: string): { code: boolean; text: string; language?: string }[] {
  const patterns = [
    { start: '```', stop: '```' },
    { start: '---START CODE---', stop: '---END CODE---' }
  ]
  let parsed: { code: boolean; text: string; language?: string }[] = []
  for (const p of patterns) {
    const { start, stop } = p
    parsed = splitTextIntoChunks(text, { start, stop })
    if (parsed.length > 1 || (parsed.length === 1 && parsed[0].code)) {
      break
    }
  }

  return parsed
}

/**
 * Converts a camelCase string to snake_case.
 *
 * @description Replaces all uppercase letters in the input string with their lowercase equivalent, preceded by an underscore.
 *
 * @param {string} camelCase The input string in camelCase format.
 * 
 * @returns {string} The converted string in snake_case format.
 */
export function camelToSnake(camelCase: string): string {
  return camelCase.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Sanitizes a string by replacing all non-alphanumeric characters, underscores, hyphens, and dots with an underscore.
 *
 * @description This function takes a string input and returns the sanitized version of it.
 * 
 * @param {string} input - The string to be sanitized.
 * 
 * @returns {string} The sanitized string.
 */
export function sanitizeString(input: string): string {
  return input.replace(/[^a-zA-Z0-9_\-\.]/g, '-')
}
