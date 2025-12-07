// ==========================================
// 1. إعدادات Firebase
// ==========================================
// ⚠️⚠️ يجب وضع بياناتك هنا بدلاً من النصوص العربية ⚠️⚠️
const firebaseConfig = {
    apiKey: "ضع_مفتاح_API_هنا",  // <--- المفتاح الطويل يبدأ بـ AIza
    authDomain: "اسم-مشروعك.firebaseapp.com",
    projectId: "اسم-مشروعك",
    storageBucket: "اسم-مشروعك.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:xxx:xxx"
};

// --- فحص الأخطاء قبل البدء ---
function checkConfig() {
    if (firebaseConfig.apiKey.includes("ضع_مفتاح")) {
        Swal.fire({
            icon: 'error',
            title: 'تنبيه هام!',
            text: 'لم تقم بوضع إعدادات Firebase في ملف script.js. لن يعمل التطبيق بدونها.',
            footer: '<a href="https://console.firebase.google.com" target="_blank">كيف أحصل على المفتاح؟</a>'
        });
        return false;
    }
    return true;
}

// تهيئة التطبيق بأمان
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (error) {
    console.error("Firebase Error:", error);
}

// ==========================================
// 2. منطق التطبيق
// ==========================================
let myData = null;
let activeChatID = null;
let unsubscribeChat = null;

window.onload = function() {
    if (!checkConfig()) return; // إيقاف التشغيل إذا لم توجد إعدادات

    const saved = localStorage.getItem("chatUserPro");
    if (saved) {
        startApp(JSON.parse(saved));
    }
};

function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}

function registerUser() {
    if (!checkConfig()) return;

    const nameInput = document.getElementById('username-input');
    const name = nameInput.value.trim();

    if (!name) {
        Swal.fire('تنبيه', 'الرجاء كتابة اسمك أولاً', 'warning');
        return;
    }

    showLoader(true);

    const randomID = Math.floor(1000 + Math.random() * 9000);
    const uniqueID = `${name.replace(/\s/g, '')}#${randomID}`;
    const userData = {
        name: name,
        id: uniqueID,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'online'
    };

    db.collection("users").doc(uniqueID).set(userData)
    .then(() => {
        localStorage.setItem("chatUserPro", JSON.stringify(userData));
        showLoader(false);
        startApp(userData);
        Swal.fire({
            icon: 'success',
            title: 'تم التسجيل بنجاح',
            text: `معرفك هو: ${uniqueID}`,
            timer: 2000,
            showConfirmButton: false
        });
    })
    .catch((error) => {
        showLoader(false);
        Swal.fire('خطأ', 'تأكد من إعدادات Firebase أو اتصال الإنترنت', 'error');
        console.error(error);
    });
}

function startApp(user) {
    myData = user;
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').style.display = 'flex'; // استخدام flex بدلاً من active للكلاس

    document.getElementById('display-name').innerText = user.name;
    document.getElementById('my-unique-id').innerText = user.id;
    document.getElementById('my-avatar').innerText = user.name.charAt(0).toUpperCase();

    listenForRequests();
    listenForFriends();
}

function logout() {
    Swal.fire({
        title: 'تسجيل الخروج؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("chatUserPro");
            location.reload();
        }
    });
}

function copyMyID() {
    navigator.clipboard.writeText(myData.id);
    const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
    });
    Toast.fire({ icon: 'success', title: 'تم نسخ الـ ID' });
}

// --- نظام الأصدقاء ---
function sendFriendRequest() {
    const friendID = document.getElementById('friend-id-input').value.trim();
    if(!friendID) return Swal.fire('خطأ', 'اكتب الـ ID', 'error');
    if(friendID === myData.id) return Swal.fire('خطأ', 'لا يمكنك إضافة نفسك', 'error');

    showLoader(true);
    db.collection("users").doc(friendID).get().then((doc) => {
        showLoader(false);
        if (doc.exists) {
            db.collection("requests").add({
                fromID: myData.id, fromName: myData.name, toID: friendID, status: "pending"
            }).then(() => {
                Swal.fire('تم', 'تم إرسال طلب الصداقة', 'success');
                document.getElementById('friend-id-input').value = "";
            });
        } else {
            Swal.fire('غير موجود', 'تأكد من صحة الـ ID', 'error');
        }
    }).catch(err => {
        showLoader(false);
        Swal.fire('خطأ', 'حدث خطأ في الاتصال', 'error');
    });
}

function listenForRequests() {
    db.collection("requests").where("toID", "==", myData.id).where("status", "==", "pending")
        .onSnapshot((snapshot) => {
            const list = document.getElementById('requests-list');
            list.innerHTML = "";
            if(snapshot.empty) {
                list.innerHTML = "<p style='text-align:center;color:#999;margin-top:20px'>لا توجد طلبات</p>";
                document.getElementById('req-badge').style.display = 'none';
            } else {
                document.getElementById('req-badge').style.display = 'inline-block';
                document.getElementById('req-badge').innerText = snapshot.size;
            }

            snapshot.forEach((doc) => {
                const req = doc.data();
                const div = document.createElement('div');
                div.className = 'user-card';
                div.innerHTML = `
                    <div style="flex:1">
                        <h4>${req.fromName}</h4>
                        <small>${req.fromID}</small>
                    </div>
                    <button class="btn-main" style="width:auto; padding:5px 15px; font-size:0.8rem" 
                    onclick="acceptRequest('${doc.id}', '${req.fromID}', '${req.fromName}')">قبول</button>
                `;
                list.appendChild(div);
            });
        });
}

function acceptRequest(reqID, fID, fName) {
    const batch = db.batch();
    batch.update(db.collection("requests").doc(reqID), { status: "accepted" });
    batch.set(db.collection("users").doc(myData.id).collection("friends").doc(fID), { id: fID, name: fName });
    batch.set(db.collection("users").doc(fID).collection("friends").doc(myData.id), { id: myData.id, name: myData.name });

    batch.commit().then(() => {
        Swal.fire('مبروك', 'تمت الإضافة بنجاح', 'success');
        showTab('friends');
    });
}

function listenForFriends() {
    db.collection("users").doc(myData.id).collection("friends")
        .onSnapshot((snapshot) => {
            const list = document.getElementById('friends-list');
            list.innerHTML = "";
            if(snapshot.empty) list.innerHTML = "<p style='text-align:center;color:#999;margin-top:20px'>أضف أصدقاء لتبدأ</p>";

            snapshot.forEach((doc) => {
                const f = doc.data();
                const div = document.createElement('div');
                div.className = 'user-card';
                div.onclick = () => openChat(f.id, f.name);
                div.innerHTML = `
                    <div class="avatar" style="width:40px;height:40px;font-size:1rem;margin:0 0 0 10px">${f.name[0]}</div>
                    <div style="flex:1"><h4>${f.name}</h4></div>
                    <i class="fas fa-comment-dots" style="color:var(--primary)"></i>
                `;
                list.appendChild(div);
            });
        });
}

// --- الشات ---
function openChat(fID, fName) {
    activeChatID = fID;
    document.getElementById('chat-room').classList.add('active');
    document.getElementById('chat-username').innerText = fName;
    document.getElementById('messages-area').innerHTML = '<div class="spinner" style="margin:20px auto"></div>';

    const chatID = [myData.id, fID].sort().join("_");
    if(unsubscribeChat) unsubscribeChat();

    unsubscribeChat = db.collection("chats").doc(chatID).collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            const area = document.getElementById('messages-area');
            area.innerHTML = "";
            snapshot.forEach(doc => {
                const msg = doc.data();
                const div = document.createElement('div');
                div.className = `message ${msg.senderID === myData.id ? 'sent' : 'received'}`;
                div.innerText = msg.text;
                area.appendChild(div);
            });
            area.scrollTop = area.scrollHeight;
        });
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if(!text || !activeChatID) return;

    const chatID = [myData.id, activeChatID].sort().join("_");
    db.collection("chats").doc(chatID).collection("messages").add({
        text: text, senderID: myData.id, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = "";
}

function handleInputKey(e) { if(e.key === 'Enter') sendMessage(); }
function closeChat() { document.getElementById('chat-room').classList.remove('active'); activeChatID = null; }

function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.add('active');
}