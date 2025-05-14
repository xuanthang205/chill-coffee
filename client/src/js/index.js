import { getProductList } from "./get-products.js";

// Gọi hàm hiển thị sản phẩm khi trang tải
document.addEventListener('DOMContentLoaded', () => {
    const productContainer = document.querySelector('.product-list');
    getProductList(productContainer, 4); // Giới hạn 4 sản phẩm
});