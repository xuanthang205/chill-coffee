// src/js/admin.js
import { auth, db } from "./firebase-config.js";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, where, query, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { checkSession } from "./check-session.js";

let userSession = JSON.parse(localStorage.getItem("user_session"));
let editProductId = null;
let allProductsCache = []; // Cache toàn bộ sản phẩm sau khi load

checkSession();

document.addEventListener("DOMContentLoaded", async () => {
    try {
        if (!userSession) {
            alert("Vui lòng đăng nhập để truy cập!");
            window.location.href = "./index.html";
            return;
        }

        const email = userSession.user.email;
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Không tìm thấy người dùng!");
            window.location.href = "./index.html";
            return;
        }

        querySnapshot.forEach((doc) => {
            const user = doc.data();
            if (user.role_id !== 1 && user.role_id !== 2) {
                alert("Bạn không có quyền truy cập!");
                window.location.href = "./index.html";
            }
        });

        await loadProducts();
        setupSearchFeature(); // Gắn chức năng tìm kiếm và clear sau khi load
    } catch (error) {
        console.error("Lỗi khi kiểm tra quyền truy cập:", error);
        alert("Có lỗi xảy ra khi kiểm tra quyền truy cập!");
    }
});

// Thêm hoặc cập nhật sản phẩm
document.getElementById("product-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const productName = document.getElementById("product_name").value;
    const productPrice = document.getElementById("product_price").value;
    const productImage = document.getElementById("product_image").files[0];
    const saveBtn = document.querySelector("#product-form button[type='submit']");
    const spinner = document.getElementById("loadingSpinner");

    if (!productName || !productPrice || (!productImage && !editProductId)) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    try {
        // Disable UI và hiển thị đang xử lý
        saveBtn.disabled = true;
        saveBtn.innerText = "Đang lưu...";
        spinner.classList.remove("d-none");

        let imageUrl = null;

        const allProductsSnapshot = await getDocs(collection(db, "products"));
        const allProducts = allProductsSnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name.toLowerCase().trim(),
        }));

        const currentName = productName.toLowerCase().trim();
        const isDuplicate = allProducts.some((p) => p.name === currentName && p.id !== editProductId);

        if (isDuplicate) {
            alert("Sản phẩm đã tồn tại. Vui lòng chọn tên khác!");
            return;
        }

        if (productImage) {
            const formData = new FormData();
            formData.append("image", productImage);
            const response = await fetch("http://localhost:3000/upload", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();

            if (!result.data?.secure_url) {
                throw new Error("Upload ảnh thất bại!");
            }

            imageUrl = result.data.secure_url;
        }

        if (!editProductId) {
            await addDoc(collection(db, "products"), {
                name: productName,
                price: parseFloat(productPrice),
                imageUrl: imageUrl,
                createdAt: serverTimestamp(),
            });

            alert("Thêm sản phẩm thành công!");
        } else {
            const productRef = doc(db, "products", editProductId);
            await updateDoc(productRef, {
                name: productName,
                price: parseFloat(productPrice),
                ...(imageUrl && { imageUrl }),
            });

            alert("Cập nhật sản phẩm thành công!");
            editProductId = null;
            document.getElementById("product_image").required = true;
        }

        document.getElementById("product-form").reset();
        await loadProducts(); // Giao diện render lại sau khi xong
    } catch (error) {
        console.error("Lỗi khi lưu sản phẩm:", error);
        alert("Có lỗi xảy ra khi lưu sản phẩm!");
    } finally {
        // Luôn khôi phục UI dù thành công hay lỗi
        saveBtn.disabled = false;
        saveBtn.innerText = "Lưu";
        spinner.classList.add("d-none");
    }
});

// Load và hiển thị danh sách sản phẩm
async function loadProducts() {
    try {
        const productTableBody = document.getElementById("product-list");
        let htmls = "";

        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];

        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        products.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return a.createdAt.seconds - b.createdAt.seconds;
        });

        allProductsCache = products; // Gán cache để tìm kiếm dùng

        products.forEach((product, index) => {
            htmls += `
                <tr class="product-item text-center">
                    <th>${index + 1}</th>
                    <td><img src="${product.imageUrl}" alt="${product.name}"></td>
                    <td>${product.name}</td>
                    <td>${product.price.toLocaleString("vi-VN")} VND</td>
                    <td>
                        <button class="btn btn-warning btn-sm btn-edit-product rounded-sm me-2"
                            data-id="${product.id}"
                            data-name="${product.name}"
                            data-price="${product.price}"
                            data-image="${product.imageUrl}">
                            Sửa
                        </button>
                        <button class="btn btn-danger btn-sm btn-delete-product rounded-sm"
                            data-id="${product.id}">
                            Xóa
                        </button>
                    </td>
                </tr>
            `;
        });

        productTableBody.innerHTML = htmls;

        document.querySelectorAll(".btn-delete-product").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const productId = btn.getAttribute("data-id");
                if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
                    try {
                        await deleteDoc(doc(db, "products", productId));
                        alert("Xóa sản phẩm thành công!");
                        await loadProducts();
                    } catch (error) {
                        console.error("Lỗi khi xóa sản phẩm:", error);
                        alert("Có lỗi xảy ra khi xóa sản phẩm!");
                    }
                }
            });
        });

        document.querySelectorAll(".btn-edit-product").forEach((btn) => {
            btn.addEventListener("click", () => {
                editProductId = btn.getAttribute("data-id");
                document.getElementById("product_name").value = btn.getAttribute("data-name");
                document.getElementById("product_price").value = btn.getAttribute("data-price");
                document.getElementById("product_image").required = false;
                alert("Vui lòng chọn lại ảnh nếu muốn thay đổi!");
            });
        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
    }
}

// Tìm kiếm và Clear
function setupSearchFeature() {
    const input = document.getElementById("admin-search");
    const clearBtn = document.getElementById("clearInput");
    const productTableBody = document.getElementById("product-list");

    input.addEventListener("input", () => {
        const keyword = input.value.trim().toLowerCase();

        let filtered = [...allProductsCache];

        if (keyword !== "") {
            filtered = filtered.filter((p) => p.name.toLowerCase().includes(keyword));
        } else {
            // Khôi phục lại thứ tự gốc
            filtered.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return a.createdAt.seconds - b.createdAt.seconds;
            });
        }

        renderSearchResults(filtered);
    });

    clearBtn.addEventListener("click", () => {
        input.value = "";
        input.focus();

        const sorted = [...allProductsCache].sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return a.createdAt.seconds - b.createdAt.seconds;
        });

        renderSearchResults(sorted);
    });

    function renderSearchResults(list) {
        let htmls = "";
        list.forEach((product, index) => {
            htmls += `
                <tr class="product-item text-center">
                    <th>${index + 1}</th>
                    <td><img src="${product.imageUrl}" alt="${product.name}"></td>
                    <td>${product.name}</td>
                    <td>${product.price.toLocaleString("vi-VN")} VND</td>
                    <td>
                        <button class="btn btn-warning btn-sm btn-edit-product rounded-sm me-2"
                            data-id="${product.id}"
                            data-name="${product.name}"
                            data-price="${product.price}"
                            data-image="${product.imageUrl}">
                            Sửa
                        </button>
                        <button class="btn btn-danger btn-sm btn-delete-product rounded-sm"
                            data-id="${product.id}">
                            Xóa
                        </button>
                    </td>
                </tr>
            `;
        });
        productTableBody.innerHTML = htmls;

        // Gắn lại sự kiện cho nút sau khi render
        document.querySelectorAll(".btn-delete-product").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const productId = btn.getAttribute("data-id");
                if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
                    try {
                        await deleteDoc(doc(db, "products", productId));
                        alert("Xóa sản phẩm thành công!");
                        await loadProducts();
                    } catch (error) {
                        console.error("Lỗi khi xóa sản phẩm:", error);
                        alert("Có lỗi xảy ra khi xóa sản phẩm!");
                    }
                }
            });
        });

        document.querySelectorAll(".btn-edit-product").forEach((btn) => {
            btn.addEventListener("click", () => {
                editProductId = btn.getAttribute("data-id");
                document.getElementById("product_name").value = btn.getAttribute("data-name");
                document.getElementById("product_price").value = btn.getAttribute("data-price");
                document.getElementById("product_image").required = false;
                alert("Vui lòng chọn lại ảnh nếu muốn thay đổi!");
            });
        });
    }
}
