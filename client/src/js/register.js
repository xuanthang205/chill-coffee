import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { setDoc, doc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

const inpUsername = document.querySelector(".inp-username");
const inpEmail = document.querySelector(".inp-email");
const inpPwd = document.querySelector(".inp-pwd");
const inpConfirmPwd = document.querySelector(".inp-cf-pw");
const registerForm = document.querySelector("#register-form");

function handleRegister(event) {
    event.preventDefault();
    let username = inpUsername.value.trim();
    let email = inpEmail.value.trim();
    let password = inpPwd.value;
    let confirmPassword = inpConfirmPwd.value;
    let role_id = 3; // Guest mặc định

    if (!username || !email || !password || !confirmPassword) {
        alert("Vui lòng điền đủ các trường");
        return;
    }
    if (password !== confirmPassword) {
        alert("Mật khẩu không khớp");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                username,
                email,
                // Không nên lưu mật khẩu dạng plain text
                role_id,
                balance: 0,
                is_disabled: false
            };

            return setDoc(doc(db, "users", user.uid), userData);
        })
        .then(() => {
            alert("Đăng ký thành công");
            window.location.href = "login.html";
        })
        .catch((error) => {
            if (error.code === "auth/email-already-in-use") {
                alert("Email đã được sử dụng. Vui lòng chọn email khác.");
            } else if (error.code === "auth/invalid-email") {
                alert("Email không hợp lệ.");
            } else if (error.code === "auth/weak-password") {
                alert("Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (ít nhất 6 ký tự).");
            } else {
                alert("Lỗi: " + error.message);
            }
        });
}

registerForm.addEventListener("submit", handleRegister);
