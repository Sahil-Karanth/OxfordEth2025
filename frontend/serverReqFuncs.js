async function maybeSendNodeReq(portObj, reqObj) {
    try {

      const randomNumber = Math.floor(Math.random() * 100) + 1;

      if (randomNumber < portObj.failChance) return null;

      const response = await fetch(
          `http://localhost:${portObj.port}`,
          reqObj
        );

      return response
    } catch (err) {
        console.log(err)
        return null
    }
}

async function multiNodeReqs(portFailChancePairs, reqObj) {

    let responseText = "COULDN'T CONNECT TO ANY PEERS";

    var iterCount = 0;
    while (true) {

        try {
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

        } catch (err) {
        console.log(err)
        }


    }
    return responseText
}
module.exports = {
    multiNodeReqs
}
