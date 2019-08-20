import { Worker, isMainThread, workerData } from 'worker_threads'
import xlsx from "node-xlsx"
import debug from 'debug'

const DEBUG = debug('xlsx-hero:buffer-reader')

interface ReaderParams {
  onMessage: (data: any) => void
  onError: (data: any) => void
  onExit: (data: any) => void
}

if (!isMainThread) {
  // const buffer = workerData
  DEBUG('buffer received')
  const start = new Date()
  const buf = Buffer.from(workerData)
  const sheet = xlsx.parse(buf, { raw: false })[0]
  DEBUG(`buffer created, cost ${new Date().valueOf() - start.valueOf()}`)
  const datas = sheet.data
  console.log(datas)
}

export function reader({
  onMessage,
  onError,
  onExit
}: ReaderParams) {
  return async function(buffer: Buffer) {
    if (isMainThread) {
      const worker = new Worker(__filename, { workerData: buffer })
      
      worker.on('message', onMessage)
      worker.on('error', onError)
      worker.on('exit', onExit)

    }
  }
}