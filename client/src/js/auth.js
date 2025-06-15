document.querySelectorAll(".show-password").forEach((button) => {
    const input = button.previousElementSibling;

    // Khi giữ chuột => hiện mật khẩu + select
    button.addEventListener("mousedown", () => {
        input.type = "text";
        input.select();
    });

    // Khi thả chuột => ẩn lại
    button.addEventListener("mouseup", () => {
        input.type = "password";
    });

    // Khi rê chuột ra khỏi nút => cũng ẩn lại
    button.addEventListener("mouseleave", () => {
        input.type = "password";
    });
});
