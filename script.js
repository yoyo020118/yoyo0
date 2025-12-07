// public/client.js
const socket = io();

const loginScreen = document.getElementById('login-screen');
const appInterface = document.getElementById('app-interface');
const messageInput = document.getElementById('messageInp');
const chatContainer = document.querySelector(".chat-container");
const typingIndicator = document.getElementById('typing-indicator');

let name;
const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3'); // صوت إشعار بسيط

// دالة الدخول للشات
function joinChat() {
    const inputName = document.getElementById('username-input').value;
    if(inputName.trim() !== "") {
        name = inputName;
        loginScreen.style.display = "none";
        appInterface.style.display = "flex";
        
        socket.emit('new-user-joined', name);
    } else {
        alert("الرجاء كتابة اسم!");
    }
}

// دالة إضافة الرسائل للشاشة
const appendMessage = (message, position, time, senderName) => {
    const messageElement = document.createElement('div');
    
    // إذا كانت رسالة نظام (دخول/خروج)
    if (position === 'center') {
        messageElement.classList.add('system-msg');
        messageElement.innerText = message;
    } else {
        // رسالة عادية
        messageElement.classList.add('message');
        messageElement.classList.add(position);
        
        let content = `<div>${message}</div>`;
        if(senderName) content = `<strong>${senderName}</strong><br>` + content;
        
        content += `<small>${time}</small>`;
        messageElement.innerHTML = content;
        
        if (position === 'left') {
            audio.play(); // تشغيل صوت عند استلام رسالة
        }
    }
    
    chatContainer.append(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight; // النزول لآخر رسالة
}

// إرسال الرسالة عند الضغط على الزر
function sendMessage() {
    const message = messageInput.value;
    if (message.trim() !== "") {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        appendMessage(message, 'right', time, null); // عرض رسالتي عندي
        socket.emit('send', message); // إرسال للسيرفر
        messageInput.value = '';
    }
}

// الإرسال عند ضغط Enter
messageInput.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    } else {
        socket.emit('typing'); // إرسال إشارة الكتابة
    }
});

// استقبال الرسائل من السيرفر
socket.on('receive', data => {
    typingIndicator.innerText = ""; // إخفاء "يكتب الآن" عند وصول الرسالة
    appendMessage(data.message, 'left', data.time, data.name);
});

// استقبال إشعار دخول مستخدم
socket.on('user-joined', name => {
    appendMessage(`${name} انضم للمحادثة`, 'center');
});

// استقبال إشعار خروج مستخدم
socket.on('left', name => {
    appendMessage(`${name} غادر المحادثة`, 'center');
});

// ميزة "جاري الكتابة..."
let typingTimer;
socket.on('display-typing', (userName) => {
    typingIndicator.innerText = `${userName} يكتب الآن...`;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        typingIndicator.innerText = "";
    }, 1000);
});

