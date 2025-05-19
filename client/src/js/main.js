// src/js/index.js
import { auth } from './firebase-config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

// Lấy userSession từ localStorage
const userSession = JSON.parse(localStorage.getItem('user_session'));

// Xử lý profile dropdown
document.addEventListener('DOMContentLoaded', () => {
  const profileDropdown = document.querySelector('#author-menu-drd');

  if (userSession) {
    const now = new Date().getTime();
    if (now < userSession.expiry) {
      // Build dropdown html theo role_id
      let dropdownHtml = ``;

      if (userSession.user.id === 1) {
        dropdownHtml += `
          <li class="bg-grey-light"><span class="dropdown-item name">${userSession.user.email}</span></li>
          <li><a class="dropdown-item" href="./order_history.html">Lịch sử đơn hàng</a></li>
          <li><a class="dropdown-item" href="./wallet.html">Ví</a></li>
          <li><a class="dropdown-item" href="./admin.html">Trang Admin</a></li>
          <li><button id="logout-btn" class="btn text-danger w-100 text-start">Đăng xuất</button></li>
        `;
      } else {
        dropdownHtml += `
          <li class="bg-grey-light"><span class="dropdown-item name">${userSession.user.email}</span></li>
          <li><a class="dropdown-item" href="./order_history.html">Lịch sử đơn hàng</a></li>
          <li><a class="dropdown-item" href="./wallet.html">Ví</a></li>
          <li><button id="logout-btn" class="btn text-danger w-100 text-start">Đăng xuất</button></li>
        `;
      }

      profileDropdown.innerHTML = dropdownHtml;

      // Xử lý đăng xuất
      document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
          signOut(auth)
            .then(() => {
              localStorage.removeItem('user_session');
              window.location.href = "./index.html";
            })
            .catch((error) => {
              console.error("Lỗi khi đăng xuất:", error);
              alert("Có lỗi xảy ra khi đăng xuất!");
            });
        }
      });
    } else {
      // Xóa session nếu hết hạn
      localStorage.removeItem('user_session');
      console.log("Phiên đăng nhập đã hết hạn!");
    }
  } else {
    // Giữ nguyên dropdown mặc định cho khách chưa đăng nhập
    profileDropdown.innerHTML = `
      <li><a class="dropdown-item" href="./login.html">Đăng nhập</a></li>
      <li><a class="dropdown-item" href="./register.html">Đăng ký</a></li>
    `;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.getElementById("menu-mb-btn");
  const closeBtn = document.getElementById("close-menu-mb-btn");
  const overlay = document.querySelector(".overlay");
  const headerNav = document.querySelector(".header-nav");

  // Mở menu
  menuBtn.addEventListener("click", () => {
    headerNav.classList.add("show");
    overlay.classList.add("show");
  });

  // Đóng menu
  const closeMenu = () => {
    headerNav.classList.remove("show");
    overlay.classList.remove("show");
  };

  closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
});
