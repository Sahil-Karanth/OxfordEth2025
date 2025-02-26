async function maybeSendNodeReq(port, reqObj) {
    try {
      const response = await fetch(
            `http://localhost:${port}`,
            reqObj
          );
      return response
    } catch (err) {
      return null
    }
}
  
async function multiNodeReqs(portArray, reqObj) {
    let responseText = "COULDN'T CONNECT TO ANY PEERS";

    var iterCount = 0;
    while (true) {
        const portToConnect = portArray[0];
        const response = await maybeSendNodeReq(portToConnect, reqObj);

        if (response != null) {
            console.log(`SUCCESS on port ${portToConnect}`)
            responseText = await response.text();
            break;
        } else {
            console.log(`port ${portToConnect} failed to connect`)
            // move to end of queue
            portArray.splice(0, 1)
            portArray.push(portToConnect)
        }

        if (iterCount == portArray.length) {
            break
        }

        iterCount += 1
    }
    return responseText
}

module.exports = {
    multiNodeReqs
}
