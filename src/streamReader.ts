import * as stream from 'stream'
import * as fs from 'fs'
import debug from 'debug'

interface ReaderProps {
  path: string
}

export class Reader {
  public stream: fs.ReadStream

  constructor({
    path
  }: ReaderProps) {
    this.stream = fs.createReadStream(path)
  }
}
