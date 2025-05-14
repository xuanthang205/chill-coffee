import { getProductList, setupSearchAndSort } from './get-products.js';

window.addEventListener('DOMContentLoaded', ()=>{
    const productList = document.querySelector('.product-list');
    // Gọi hàm getProductList
    getProductList(productList);
     // Gọi hàm để thiết lập tìm kiếm và sắp xếp
     setupSearchAndSort('searchInput', 'priceSort', productList);
})