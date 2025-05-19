import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

const inpEmail = document.querySelector(".inp-email");
const inpPwd = document.querySelector(".inp-pwd");
const loginForm = document.querySelector("#login-form");

async function handleLogin(event) {
    event.preventDefault();
    let email = inpEmail.value;
    let password = inpPwd.value;

    if (!email || !password) {
        alert("Vui lòng điền đủ các trường");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Query Firestore theo email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const userData = docSnap.data();

            const userSession = {
                user: {
                    email: user.email,
                    id: userData.role_id
                },
                expiry: new Date().getTime() + 2 * 60 * 60 * 1000, // 2 giờ
            };

            localStorage.setItem('user_session', JSON.stringify(userSession));
            alert("Đăng nhập thành công");
            window.location.href = "index.html";
        } else {
            alert("Không tìm thấy thông tin người dùng trong Firestore.");
        }

    } catch (error) {
        alert("Lỗi: " + error.message);
    }
}

loginForm.addEventListener("submit", handleLogin);
