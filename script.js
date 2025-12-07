// انتظر حتى يتم تحميل كل محتوى الصفحة
document.addEventListener('DOMContentLoaded', () => {

    // الحصول على العناصر الرئيسية من الصفحة
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesContainer = document.getElementById('messages-container');

    // إضافة مستمع للحدث "submit" على نموذج الإرسال
    messageForm.addEventListener('submit', (event) => {
        // منع السلوك الافتراضي للفورم (إعادة تحميل الصفحة)
        event.preventDefault();

        // الحصول على نص الرسالة من حقل الإدخال وإزالة الفراغات الزائدة
        const messageText = messageInput.value.trim();

        // التأكد من أن الرسالة ليست فارغة
        if (messageText !== '') {
            // إنشاء عنصر div جديد للرسالة
            const newMessageElement = document.createElement('div');
            newMessageElement.classList.add('message'); // إضافة كلاس CSS للتصميم
            newMessageElement.textContent = messageText; // وضع نص الرسالة داخل العنصر

            // إضافة الرسالة الجديدة إلى حاوية الرسائل
            messagesContainer.appendChild(newMessageElement);

            // مسح حقل الإدخال بعد الإرسال
            messageInput.value = '';

            // التمرير التلقائي لأسفل لعرض أحدث رسالة
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });

});