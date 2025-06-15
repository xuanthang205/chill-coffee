import { auth, db } from "./firebase-config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const form = document.getElementById("forgot-password-form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("reset-email").value.trim();
    if (!email) {
        alert("Vui lòng nhập email.");
        return;
    }

    try {
        // Kiểm tra xem email có trong Firestore hay không
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Email này chưa được đăng ký.");
            return;
        }

        // Nếu có, gửi email khôi phục
        await sendPasswordResetEmail(auth, email, {
            url: "http://127.0.0.1:5500/client/login.html",
        });

        alert("Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.");
    } catch (error) {
        console.error("Lỗi gửi email:", error.code, error.message);
        alert("Lỗi: " + error.message);
    }
});
