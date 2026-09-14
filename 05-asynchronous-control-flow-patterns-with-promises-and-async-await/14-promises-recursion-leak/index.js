function delay(milliseconds) {
  return new Promise((resolve, _reject) => {
    setTimeout(() => {
      resolve(new Date())
    }, milliseconds)
  })
}

function leakingLoop() {
  return delay(1).then(() => {
    console.log(`Tick ${Date.now()}`)
    return leakingLoop()
  })
}

function _nonLeakingLoop() {
  delay(1).then(() => {
    console.log(`Tick ${Date.now()}`)
    _nonLeakingLoop()
  })
}

function _nonLeakingLoopWithErrors() {
  return new Promise((_resolve, reject) => {
    ;(function internalLoop() {
      delay(1)
        .then(() => {
          console.log(`Tick ${Date.now()}`)
          internalLoop()
        })
        .catch(err => {
          reject(err)
        })
    })()
  })
}

async function _nonLeakingLoopAsync() {
  while (true) {
    await delay(1)
    console.log(`Tick ${Date.now()}`)
  }
}

async function _leakingLoopAsync() {
  await delay(1)
  console.log(`Tick ${Date.now()}`)
  return _leakingLoopAsync()
}

for (let i = 0; i < 1e6; i++) {
  leakingLoop()
  // _nonLeakingLoop()
  // _nonLeakingLoopWithErrors()
  // _nonLeakingLoopAsync()
  // _leakingLoopAsync()
}
