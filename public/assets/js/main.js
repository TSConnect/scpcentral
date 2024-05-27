const ipc = require('electron').ipcRenderer;

window.onload = function() {
    let data = ipc.sendSync("getCategoryFiles", "scp")
    console.log(data)
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
        document.getElementById(fileId).classList.add("active")
        let file = ipc.sendSync("getSpecific", fileId)
        document.getElementById("fileName").innerText = `File Name: ${file.fileName}`
        document.getElementById("objectClass").innerText = `Object Class: ${file.fileClass}`
        document.getElementById("fileDescription").innerHTML = ipc.sendSync("mdToHTML", file.fileDescription)
    }
    if(document.getElementById("editsSCP")){
        for(i in data){
            document.getElementById("editsSCP").innerHTML += `<option value="${data[i]["fileId"]}">${data[i]["fileName"]}</option>`
        }
    }
}

var editFileNameChange = document.getElementById('editsSCP');
if(editFileNameChange){
    editFileNameChange.onchange = (event) => {
        var fileId = event.target.value;
        if(fileId == ""){
            document.getElementById("editsObjectClass").value = ""
            document.getElementById("editsDescription").value = ""
            return
        };
        if(fileId == "editsAddNewSCP"){
            document.getElementById("editsFileId").className = "mb-3"
            document.getElementById("editsFileName").className = "mb-3"
            document.getElementById("editsObjectClass").value = ""
            document.getElementById("editsDescription").value = ""
            return;
        }
        if(fileId != "editsAddNewSCP"){
            document.getElementById("editsFileId").className = "mb-3 visually-hidden"
            document.getElementById("editsFileId-1").value = "scpxxxx"
            document.getElementById("editsFileName").className = "mb-3 visually-hidden"
            document.getElementById("editsFileName-1").value = ""
        }

        let file = ipc.sendSync("getSpecific", fileId)
        document.getElementById("editsObjectClass").value = file.fileClass
        document.getElementById("editsDescription").value = file.fileDescription
    }
}

function submitSCP(event) {
    event.preventDefault();
    let isAddition = document.getElementById("editsSCP").value == "editsAddNewSCP"
    let fileId = document.getElementById("editsSCP").value
    let fileClass = document.getElementById("editsObjectClass").value
    let fileDescription = document.getElementById("editsDescription").value
    let current = ipc.sendSync("getSpecific", fileId)
    let fileName = current.fileName;
    if(fileId == "")return showAlert("Please select an SCP or add a new scp!", 5000)
    if(fileClass == "")return showAlert("Please enter an object class!", 5000);
    if(fileDescription == "")return showAlert("Please enter the description of the SCP", 5000);
    if(isAddition){
        fileId = document.getElementById("editsFileId-1").value
        if(fileId == "" || fileId == "scpxxxx")return showAlert("Please enter a valid file ID based on the guidelines!");
        fileName = document.getElementById("editsFileName-1").value
        if(fileName == "")return showAlert("Please enter a valid file name!");
    }
    let response = (ipc.sendSync("AddandEdit", fileId, fileName, fileClass, fileDescription))
    if(response == 429){
        return showAlert("Rate limited! Please try again later!", 5000)
    }

    showAlert("Your contribution request has been submitted!", 5000)

}

function showAlert(text, time) {
    document.getElementById("editsAlertBox").className = "alert alert-success"
    document.getElementById("editsAlert").innerText = text
    setTimeout(() => {
        document.getElementById("editsAlertBox").className = "alert alert-success visually-hidden"
        document.getElementById("editsAlert").innerText = ""
    }, time)
}

function openLink(link) {
    require('electron').shell.openExternal(link)
}