import { Worker } from 'worker_threads'

const workerSet = new Set()

export function sheetSpliter(data: any[], limit: number) {
  const dataLength = data.length
  const tasks = Math.ceil(dataLength / limit)
  let start = 0
  for (let i = 0; i < tasks; i++) {
    const right = start + limit
    const chunk = data.splice(start, right)
    const worker = new Worker(__filename, { workerData: chunk })
    
    worker.on('message', function() {

    })
    
    worker.on('error', function() {

    })
    
    worker.on('exit', function() {

    })
    workerSet.add(worker)

  }
}