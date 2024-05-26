const ipc = require('electron').ipcRenderer;

window.onload = function() {
    console.log(window.location.href)
    let data = ipc.sendSync("getCategoryFiles", "scp")
    for(i in data){
        document.getElementById("anomaliesFiles").innerHTML += `
        <li class="nav-item"><a id="${data[i]["fileId"]}" class="nav-link" href="anomalies.html?fileId=${data[i]["fileId"]}"><i class="fa fa-file icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"></i><span class="nav-link-text ms-1">${data[i]["fileName"]}<br></span></a></li>
        `
    }

    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
      // Get the value of "some_key" in eg "https://example.com/?some_key=some_value"
    let fileId = params.fileId;

    if(fileId != undefined){
        let file = ipc.sendSync("getSpecific", fileId)
        document.getElementById(fileId).classList.add("active")
        document.getElementById("fileName").innerText = `File Name: ${file.fileName}`
        document.getElementById("objectClass").innerText = `Object Class: ${file.fileClass}`
        document.getElementById("fileDescription").innerHTML = ipc.sendSync("mdToHTML", file.fileDescription)
    }
}