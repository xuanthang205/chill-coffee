// role.js
document.addEventListener("DOMContentLoaded", () => {
  const session = JSON.parse(localStorage.getItem("user_session"));

  // Khóa mặc định tất cả liên kết cần quyền admin
  const linksToLock = [];

  document.querySelectorAll(".sidebar a").forEach(link => {
    const text = link.textContent.trim().toLowerCase();

    if (text === "sản phẩm" || text === "quyền") {
      linksToLock.push(link);

      Object.assign(link.style, {
        pointerEvents: "none",
        opacity: "0.5",
        cursor: "not-allowed"
      });

      // Chặn click ngay lập tức
      link.addEventListener("click", e => e.preventDefault());
    }
  });

  // Sau khi DOM load, kiểm tra session từ localStorage
  if (session && session.user && session.user.id) {
    const now = new Date().getTime();

    // Nếu phiên hợp lệ
    if (now < session.expiry) {
      const roleId = parseInt(session.user.id);

      // Nếu là admin
      if (roleId === 1) {
        linksToLock.forEach(link => {
          Object.assign(link.style, {
            pointerEvents: "auto",
            opacity: "1",
            cursor: "pointer"
          });

          // Xóa chặn click bằng cách clone
          link.replaceWith(link.cloneNode(true));
        });
      }
    } else {
      localStorage.removeItem("user_session"); // Hết hạn thì xóa luôn
      console.warn("Phiên đăng nhập đã hết hạn.");
    }
  }
});

