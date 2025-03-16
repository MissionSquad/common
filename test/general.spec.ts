import { 
  base64ToObject, 
  camelToSnake, 
  createHash, 
  extractCodeBlocks, 
  log, 
  md5, 
  objectToBase64, 
  parseText, 
  randomId, 
  retryWithExponentialBackoff, 
  sanitizeString, 
  sleep, 
  splitTextIntoChunks 
} from '../src/general'

describe('utils', () => {
  it('should log', () => {
    log({ level: 'info', msg: 'test' })
  })

  it('should sleep', async () => {
    await sleep(100)
  })

  it('should encode an object in base64', () => {
    const encoded = objectToBase64({key: 'string'})
    expect(encoded).toBe('eyJrZXkiOiJzdHJpbmcifQ==')
  })

  it('should decode an object from base64',  () => {
    const decoded = base64ToObject('eyJrZXkiOiJzdHJpbmcifQ==')
    expect(decoded).toEqual({key: 'string'})
  })

  it('should sanitize a string', () => {
    const sanitized = sanitizeString('test@#$%^&*()+=[]{}|;')
    expect(sanitized).toBe('test-----------------')
  })

  it('should retry a failed promise', async () => {
    let count = 1
    const failedPromise = async () => {
      count+=1
      await sleep(1000)
      if (count === 3) {
        return Promise.resolve('success')
      }
      return Promise.reject('failed')
    }
    
    const response = await retryWithExponentialBackoff(failedPromise, () => {}, 3, 750)
    expect(response).toBe('success')
    expect(count).toBe(3)
  })

  it('should retry a failed promise and fail', async () => {
    let count = 1
    const failedPromise = async () => {
      count+=1
      await sleep(1000)
      return Promise.reject('failed')
    }
    const response = await retryWithExponentialBackoff(failedPromise, () => {}, 3, 750)
      .catch((error) => {
        expect(error).toBe('failed')
      })
    expect(count).toBe(4)
  })

  // Tests for randomId
  it('should generate a random ID with default length', () => {
    const id = randomId()
    expect(typeof id).toBe('string')
    expect(id.length).toBe(21)
  })

  it('should generate a random ID with specified length', () => {
    const length = 10
    const id = randomId(length)
    expect(id.length).toBe(length)
  })

  it('should generate unique IDs', () => {
    const id1 = randomId()
    const id2 = randomId()
    expect(id1).not.toBe(id2)
  })

  // Tests for createHash
  it('should create a hash from a string', async () => {
    const hash = await createHash('test')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(40) // SHA-1 hash is 40 characters in hex
  })

  it('should create a hash from an object', async () => {
    const hash = await createHash({ key: 'value' })
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(40)
  })

  it('should create the same hash for the same input', async () => {
    const input = 'test'
    const hash1 = await createHash(input)
    const hash2 = await createHash(input)
    expect(hash1).toBe(hash2)
  })

  // Tests for md5
  it('should create an MD5 hash from a string', () => {
    const hash = md5('test')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(32) // MD5 hash is 32 characters in hex
  })

  it('should create an MD5 hash from an object', () => {
    const hash = md5({ key: 'value' })
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(32)
  })

  it('should create the same MD5 hash for the same input', () => {
    const input = 'test'
    const hash1 = md5(input)
    const hash2 = md5(input)
    expect(hash1).toBe(hash2)
  })

  // Tests for extractCodeBlocks
  it('should extract code blocks with a single pattern', () => {
    const text = 'Some text\n```\ncode block\n```\nMore text'
    const patterns = [{ start: '```', stop: '```' }]
    const blocks = extractCodeBlocks(text, patterns)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toBe('code block')
  })

  it('should extract code blocks with multiple patterns', () => {
    const text = 'Some text\n```\ncode block 1\n```\nMore text\n---START CODE---\ncode block 2\n---END CODE---\n'
    const patterns = [
      { start: '```', stop: '```' },
      { start: '---START CODE---', stop: '---END CODE---' }
    ]
    const blocks = extractCodeBlocks(text, patterns)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toBe('code block 1')
    expect(blocks[1]).toBe('code block 2')
  })

  it('should return an empty array when no code blocks are found', () => {
    const text = 'Some text without code blocks'
    const patterns = [{ start: '```', stop: '```' }]
    const blocks = extractCodeBlocks(text, patterns)
    expect(blocks).toHaveLength(0)
  })

  // Tests for splitTextIntoChunks
  it('should split text into code and non-code chunks', () => {
    const text = 'Some text\n```\ncode block\n```\nMore text'
    const pattern = { start: '```', stop: '```' }
    const chunks = splitTextIntoChunks(text, pattern)
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toEqual({ text: 'Some text\n', code: false })
    expect(chunks[1]).toEqual({ text: 'code block', code: true, language: undefined })
    expect(chunks[2]).toEqual({ text: '\nMore text', code: false })
  })

  it('should correctly identify the language of code blocks', () => {
    const text = 'Some text\n```javascript\nconst x = 5;\n```\nMore text'
    const pattern = { start: '```', stop: '```' }
    const chunks = splitTextIntoChunks(text, pattern)
    expect(chunks[1]).toEqual({ text: 'const x = 5;', code: true, language: 'javascript' })
  })

  it('should handle text with no code blocks', () => {
    const text = 'Some text without code blocks'
    const pattern = { start: '```', stop: '```' }
    const chunks = splitTextIntoChunks(text, pattern)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toEqual({ text: 'Some text without code blocks', code: false })
  })

  // Tests for parseText
  it('should parse text with code blocks using backticks', () => {
    const text = 'Some text\n```javascript\nconst x = 5;\n```\nMore text'
    const parsed = parseText(text)
    expect(parsed).toHaveLength(3)
    expect(parsed[0]).toEqual({ text: 'Some text\n', code: false })
    expect(parsed[1]).toEqual({ text: 'const x = 5;', code: true, language: 'javascript' })
    expect(parsed[2]).toEqual({ text: '\nMore text', code: false })
  })

  it('should parse text with code blocks using START/END CODE markers', () => {
    const text = 'Some text\n---START CODE---\nconst x = 5;\n---END CODE---\nMore text'
    const parsed = parseText(text)
    expect(parsed).toHaveLength(3)
    expect(parsed[0]).toEqual({ text: 'Some text\n', code: false })
    expect(parsed[1]).toEqual({ text: 'const x = 5;', code: true, language: undefined })
    expect(parsed[2]).toEqual({ text: '\nMore text', code: false })
  })

  it('should handle text with no code blocks', () => {
    const text = 'Some text without code blocks'
    const parsed = parseText(text)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toEqual({ text: 'Some text without code blocks', code: false })
  })

  // Tests for camelToSnake
  it('should convert a simple camelCase string to snake_case', () => {
    expect(camelToSnake('camelCase')).toBe('camel_case')
    expect(camelToSnake('thisIsACamelCaseString')).toBe('this_is_a_camel_case_string')
  })

  it('should handle strings that are already in snake_case', () => {
    expect(camelToSnake('snake_case')).toBe('snake_case')
  })

  it('should handle strings with numbers', () => {
    expect(camelToSnake('camel123Case')).toBe('camel123_case')
    expect(camelToSnake('camel123case456')).toBe('camel123case456')
  })
})
