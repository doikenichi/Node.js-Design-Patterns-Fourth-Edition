import assert from 'node:assert/strict'
import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline, Transform } from 'node:stream'

const streamA = createReadStream('package.json')
const streamB = new Transform({
  transform(chunk, _enc, done) {
    this.push(chunk.toString().toUpperCase())
    done()
  },
})
const streamC = createWriteStream('package-uppercase.json')

const pipelineReturn = pipeline(streamA, streamB, streamC, () => {
  // handle errors here
})

assert.equal(streamC, pipelineReturn) // valid

const pipeReturn = streamA.pipe(streamB).pipe(streamC)

assert.equal(streamC, pipeReturn) // valid
