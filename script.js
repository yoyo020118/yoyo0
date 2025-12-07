// ==========================================
// 1. إعدادات Firebase
// ==========================================
// استبدل هذا الكود ببيانات مشروعك من Firebase Console
const firebaseConfig = {
    apiKey: "ضع_مفتاح_API_هنا",
    authDomain: "اسم-مشروعك.firebaseapp.com",
    projectId: "اسم-مشروعك",
    storageBucket: "اسم-مشروعك.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:xxxxxx"
};

// تهيئة التطبيق
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 2. متغيرات النظام
// ==========================================
let myData = null;
let activeChatID = null;
let unsubscribeChat = null;

// التحقق من الدخول عند تحميل الصفحة
window.onload = function() {
    const saved = localStorage.getItem("chatUser");
    if (saved) {
        startApp(JSON.parse(saved));
    }
};

// ==========================================
// 3. وظائف التسجيل والدخول
// ==========================================
function registerUser() {
    const nameInput = document.getElementById('username-input');
    const name = nameInput.value.trim();

    if (!name) return alert("الرجاء كتابة اسمك!");

    // إنشاء ID عشوائي
    const randomID = Math.floor(1000 + Math.random() * 9000);
    const uniqueID = `${name.replace(/\s/g, '')}#${randomID}`;

    const userData = {
        name: name,
        id: uniqueID,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // حفظ في قاعدة البيانات
    db.collection("users").doc(uniqueID).set(userData)
    .then(() => {
        localStorage.setItem("chatUser", JSON.stringify(userData));
        startApp(userData);
    })
    .catch((error) => {
        console.error(error);
        alert("تأكد من إعدادات Firebase وتشغيل الإنترنت");
    });
}

function startApp(user) {
    myData = user;
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').style.display = 'flex';

    // تعبئة البيانات في القائمة الجانبية
    document.getElementById('display-name').innerText = user.name;
    document.getElementById('my-unique-id').innerText = user.id;
    document.getElementById('my-avatar').innerText = user.name.charAt(0);

    // بدء الاستماع للبيانات الحية
    listenForRequests();
    listenForFriends();
}

function logout() {
    localStorage.removeItem("chatUser");
    location.reload();
}

function copyMyID() {
    navigator.clipboard.writeText(myData.id);
    alert("تم نسخ الـ ID: " + myData.id);
}

// ==========================================
// 4. إدارة الأصدقاء والطلبات
// ==========================================
function sendFriendRequest() {
    const friendID = document.getElementById('friend-id-input').value.trim();
    
    if(!friendID) return alert("اكتب الـ ID أولاً");
    if(friendID === myData.id) return alert("لا يمكنك إضافة نفسك");

    // التحقق هل المستخدم موجود
    db.collection("users").doc(friendID).get().then((doc) => {
        if (doc.exists) {
            // إرسال الطلب
            db.collection("requests").add({
                fromID: myData.id,
                fromName: myData.name,
                toID: friendID,
                status: "pending"
            }).then(() => {
                alert("تم إرسال الطلب بنجاح!");
                document.getElementById('friend-id-input').value = "";
            });
        } else {
            alert("هذا الـ ID غير موجود، تأكد من الرقم والاسم.");
        }
    });
}

// الاستماع للطلبات الواردة
function listenForRequests() {
    db.collection("requests")
        .where("toID", "==", myData.id)
        .where("status", "==", "pending")
        .onSnapshot((snapshot) => {
            const list = document.getElementById('requests-list');
            list.innerHTML = "";
            if(snapshot.empty) list.innerHTML = "<p class='loading-text'>لا توجد طلبات جديدة.</p>";

            snapshot.forEach((doc) => {
                const req = doc.data();
                const item = document.createElement('div');
                item.className = 'user-item';
                item.innerHTML = `
                    <div class="user-info">
                        <h4>${req.fromName}</h4>
                        <small>ID: ${req.fromID}</small>
                    </div>
                    <button class="btn-accept" onclick="acceptRequest('${doc.id}', '${req.fromID}', '${req.fromName}')">موافقة</button>
                `;
                list.appendChild(item);
            });
        });
}

function acceptRequest(reqDocID, friendID, friendName) {
    // 1. تحديث حالة الطلب
    db.collection("requests").doc(reqDocID).update({ status: "accepted" });

    // 2. تسجيل الصداقة للطرفين
    const batch = db.batch();
    
    // إضافته عندي
    const myFriendRef = db.collection("users").doc(myData.id).collection("friends").doc(friendID);
    batch.set(myFriendRef, { id: friendID, name: friendName });

    // إضافتي عنده
    const theirFriendRef = db.collection("users").doc(friendID).collection("friends").doc(myData.id);
    batch.set(theirFriendRef, { id: myData.id, name: myData.name });

    batch.commit().then(() => {
        alert("تمت الإضافة! يمكنك التحدث الآن.");
        showTab('friends');
    });
}

// الاستماع لقائمة الأصدقاء
function listenForFriends() {
    db.collection("users").doc(myData.id).collection("friends")
        .onSnapshot((snapshot) => {
            const list = document.getElementById('friends-list');
            list.innerHTML = "";
            if(snapshot.empty) list.innerHTML = "<p class='loading-text'>أضف أصدقاء لتبدأ المحادثة.</p>";

            snapshot.forEach((doc) => {
                const friend = doc.data();
                const item = document.createElement('div');
                item.className = 'user-item';
                item.onclick = () => openChat(friend.id, friend.name);
                item.innerHTML = `
                    <div class="avatar" style="width:40px;height:40px;font-size:16px;">${friend.name[0]}</div>
                    <div class="user-info">
                        <h4>${friend.name}</h4>
                    </div>
                    <i class="fas fa-comment-alt" style="color:#6c5ce7"></i>
                `;
                list.appendChild(item);
            });
        });
}

// ==========================================
// 5. نظام الشات
// ==========================================
function openChat(friendID, friendName) {
    activeChatID = friendID;
    document.getElementById('chat-room').classList.add('active');
    document.getElementById('chat-username').innerText = friendName;
    document.getElementById('chat-avatar').innerText = friendName[0];
    document.getElementById('messages-area').innerHTML = "<p style='text-align:center;margin-top:20px;color:#888'>جاري تحميل الرسائل...</p>";

    // إنشاء معرف للمحادثة (ترتيب أبجدي لضمان توحيد الغرفة)
    const chatDocID = [myData.id, friendID].sort().join("_");

    if (unsubscribeChat) unsubscribeChat();

    // قراءة الرسائل
    unsubscribeChat = db.collection("chats").doc(chatDocID).collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            const area = document.getElementById('messages-area');
            area.innerHTML = "";
            snapshot.forEach((doc) => {
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
    
    if (!text || !activeChatID) return;

    const chatDocID = [myData.id, activeChatID].sort().join("_");

    db.collection("chats").doc(chatDocID).collection("messages").add({
        text: text,
        senderID: myData.id,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    input.value = "";
}

function handleInputKey(event) {
    if (event.key === 'Enter') sendMessage();
}

function closeChat() {
    document.getElementById('chat-room').classList.remove('active');
    activeChatID = null;
    if (unsubscribeChat) unsubscribeChat();
}

// التبديل بين التبويبات
function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'));
    
    document.getElementById(`tab-${name}`).classList.add('active');
    // تنشيط الزر المقابل (طريقة بسيطة)
    const btns = document.querySelectorAll('.nav-btn');
    if(name === 'friends') btns[0].classList.add('active');
    if(name === 'requests') btns[1].classList.add('active');
    if(name === 'add') btns[2].classList.add('active');
}