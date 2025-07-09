import { auth } from "./firebase-config.js";
import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

let currentUser = null;

// Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        currentUser = user;
    }
});

const form = document.getElementById("change-password-form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value.trim();
    const newPassword = document.getElementById("new-password").value.trim();
    const confirmNewPassword = document.getElementById("confirm-new-password").value.trim();

    // Kiểm tra đầu vào
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        alert("Vui lòng điền đầy đủ các trường.");
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alert("Mật khẩu mới và xác nhận không khớp!");
        return;
    }

    if (newPassword.length < 6) {
        alert("Mật khẩu mới phải có ít nhất 6 ký tự.");
        return;
    }

    try {
        // Xác thực lại người dùng trước khi đổi mật khẩu
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);

        // Kiểm tra mật khẩu mới phải khác mật khẩu cũ
        if (currentPassword === newPassword) {
            alert("Mật khẩu mới phải khác mật khẩu hiện tại.");
            return;
        }

        // Đổi mật khẩu
        await updatePassword(currentUser, newPassword);

        alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");

        // Đăng xuất và xóa session
        await signOut(auth);
        localStorage.removeItem("user_session");
        window.location.href = "login.html";
    } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error.code, error.message);

        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
                alert("Mật khẩu hiện tại không đúng.");
                break;
            case "auth/too-many-requests":
                alert("Tài khoản bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.");
                break;
            case "auth/requires-recent-login":
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                window.location.href = "login.html";
                break;
            default:
                alert("Lỗi: " + error.message);
                break;
        }
    }
});


