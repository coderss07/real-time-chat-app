const socket = io()

const btn = document.querySelector('#send-btn')
const msg = document.querySelector('#msg-inp')
const msgbox = document.querySelector('.container')

var audio = new Audio('/incoming.mp3');

const append = (message) => {
    const elem = document.createElement('div');
    elem.innerText = message;
    elem.classList.add('center-box')
    msgbox.append(elem)
    audio.play();
    msgbox.scrollTop = msgbox.scrollHeight;
}

const appendMsg = (from, message, pos) => {
    const elem = `<div class="msg-box ${pos}">
                    <b>${from}</b> 
                    <div>${message}</div>
                </div>`
    msgbox.innerHTML += elem;
    if(pos == 'left-box') {
        audio.play();
    }
    msgbox.scrollTop = msgbox.scrollHeight;
}

const _name = prompt("Please enter your name...");

if(_name == null) {
    window.close();
}

socket.emit('new-user', _name)

socket.on('user-joined', name => {
    append(`${name} joined the chat`)
})

socket.on('receive', data => {
    appendMsg(data.name, data.message, 'left-box')
})

socket.on('left', data => {
    append(`${data} left the chat`)
})

var recId = "";

btn.addEventListener('click', (e) => {
    e.preventDefault();
    if(msg.innerHTML == "") {
        return;
    }
    var message = msg.innerHTML;
    appendMsg('', message, 'right-box');
    if(recId != "") {
        socket.emit('toMention', {message: "You are mentioned by", receiverId: recId});
    }
    socket.emit('send-msg', message);
    msg.innerHTML = '';
    recId = "";
})

const downloadURL = (data, fileName) => {
    const a = document.createElement('a')
    a.href = data
    a.download = fileName
    document.body.appendChild(a)
    a.style.display = 'none'
    a.click()
    a.remove()
}
  
const dowloadFile = (fileName, url) => {
    downloadURL(url, fileName)
    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

const appendFile = (name, filename, url, pos) => {

    const elem = `<div class="msg-box ${pos}">
                    <b>${name}</b> <div class="file-${pos}">
                        <span class="filename"> ${filename}</span>
                        <span onclick="dowloadFile('${filename}', '${url}')" class="file-btn"><i class="fa-solid fa-circle-down"></i></span>
                    </div>
                </div>`;
    if(pos == 'left-box') {
        audio.play();
    }
    msgbox.innerHTML += elem;
    msgbox.scrollTop = msgbox.scrollHeight;
}

socket.on('receiveFile', data => {
    var imgArray = new Uint8Array(data.buffer);
    var src = URL.createObjectURL(
        new Blob([imgArray.buffer], {name: data.metadata.filename, type: data.metadata.type })
    );
    appendFile(data.name , data.metadata.filename, src, 'left-box');
})

document.getElementById('files').addEventListener('change', (e)=>{
    var file = e.target.files[0];
    if(!file) {
        return;
    }
    let reader = new FileReader();
    document.querySelector('#send-files').onclick = (ev)=> {
        let buff = new Uint8Array(reader.result);
        // console.log(buffer);
        var src = URL.createObjectURL(
            new Blob([buff.buffer], { type: file.type })
        );
        appendFile('', file.name, src, "right-box")
        shareFile({filename: file.name, type: file.type}, file);
        close_modal();
    }
    reader.readAsArrayBuffer(file);

    function shareFile(metadata, buffer) {
        // console.log(buffer)
        socket.emit('file-share', {buffer: buffer, metadata: metadata})
    }
    
});

document.querySelector('#bold').addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('bold', false, null);
})
document.querySelector('#italic').addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('italic', false, null);
})
document.querySelector('#strike').addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('strikeThrough', false, null);
})
document.querySelector('#hlink').addEventListener('click', (e) => {
    e.preventDefault();
    var url = prompt("Enter Link (https://example.com)");
    if(url == null || url == "") {
        return;
    }
    var selection = document.getSelection();
    document.execCommand('createLink', true, url);
    selection.anchorNode.parentElement.target = '_blank';
})
document.querySelector('#olist').addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('insertOrderedList', true, null);
})
document.querySelector('#ulist').addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('insertUnorderedList', false, "");
})
var last = true
document.querySelector('#quote').addEventListener('click', (e) => {
    e.preventDefault();
    if(last == true) {
        document.execCommand('indent', false, "");
        last = false;
    } else {
        document.execCommand('outdent', false, "");
        last = true;
    }
})
document.querySelector('#code').addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('insertHTML', false, "");
    
})
document.querySelector('#cblock').addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('insertHTML', false, "");
    
})
document.querySelector('#add-emoji').addEventListener('click', (e) => {
    e.preventDefault();
})

document.querySelector('#add-file').addEventListener('click', (e) => {
    e.preventDefault();
    open_window()
})

var container = document.querySelector('.main-box');

function open_window() {
    var modal = document.getElementById('open-file');
    modal.className = "Modal is-visuallyHidden";
    setTimeout(function() {
        container.className = "main-box is-blurred";
        modal.className = "Modal";
    }, 200);
    container.parentElement.className = "ModalOpen";
}

function close_modal() {
    var modal = document.getElementById('open-file');
    setTimeout(() => {
        document.getElementById('files').value = '';
        modal.className = "Modal is-hidden is-visuallyHidden theme";
        container.className = "main-box";
        container.parentElement.className = "";
    })
}

var typeTimer;

msg.addEventListener('keydown', (e) => {
    clearTimeout(typeTimer);
    socket.emit('send-info', 'is typing...');

})

msg.addEventListener('keyup', (e) => {
    clearTimeout(typeTimer);
    typeTimer = setTimeout(() => {
        socket.emit('send-info', 'Info...');
    }, 500)
})

socket.on('receiveinfo', data => {
    var info = data.message;
    if(data.message != "Info...") {
        info = `${data.name} ${data.message}`;
        document.querySelector('.info').style.color = "red"
    } else {
        document.querySelector('.info').style.color = "black"
    }
    document.querySelector('.info').innerText = info;
})

const mentionName = (data, id) => {
    msg.innerHTML += `&nbsp;<b style="color: #4545ff;">@${data}</b>&nbsp;`;
    recId = id;
}

socket.on('mention-user', data => {
    append(`${data.message} ${data.name}`);
})

document.querySelector('#at').addEventListener('click', (e) => {
    e.preventDefault();
    socket.emit('give-list');
    socket.on('listening', data => {
        var elem = "";
        for(let k in data.users) {
            if(k != data.id) {
                elem += `<li> <a onclick="mentionName('${data.users[k]}', '${k}')"> @${data.users[k]} </a> </li>`;
            }
        }
        var obj = document.querySelector('#user-lists');
        if(elem == "") {
            obj.innerHTML = `No user found...`;
        }else {
            obj.innerHTML = `<ul>${elem}</ul>`;
        }
        obj.style.display = 'inline';
    })
})

window.onclick = (event) => {
    var obj = document.querySelector('#user-lists');
    if(event.target != obj) {
        obj.style.display = 'none';
    }
    if(event.target == document.querySelector('.Modal')) {
        close_modal()
    }
}




