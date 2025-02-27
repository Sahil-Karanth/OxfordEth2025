async function maybeSendNodeReq(portObj, reqObj) {
    try {
        const response = await fetch(
            `http://localhost:${portObj.port}`,
            reqObj
          );

        const randomNumber = Math.floor(Math.random() * 100) + 1;
        console.log(`current fail chance is ${port.failChance}`)
        if (randomNumber < portObj.failChance) return null
          
        return response
    } catch (err) {
        return null
    }
}
  
async function multiNodeReqs(portFailChancePairs, reqObj) {

    
    let responseText = "COULDN'T CONNECT TO ANY PEERS";
    
    var iterCount = 0;
    while (true) {

        iterCount += 1

        const portObj = portFailChancePairs[0]
        const response = await maybeSendNodeReq(portObj, reqObj);

        if (!(portObj.failChance >= 0 && portObj.failChance <= 100)) throw Error("Invalid failure chance")

        if (response != null) {
            console.log(`SUCCESS on port ${portObj.port}`)
            responseText = await response.text();
            break;
        } else {
            console.log(`port ${portObj.port} failed to connect`)
            // round robin
            portFailChancePairs.splice(0, 1)
            portFailChancePairs.push(portObj)
        }

        if (iterCount == portFailChancePairs.length) {
            break
        }

    }
    return responseText
}

module.exports = {
    multiNodeReqs
}
