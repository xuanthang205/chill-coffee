import { db } from "./firebase-config.js";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, addDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { checkSession } from "./check-session.js";

let allProducts = [];
const formatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

// Load danh sách sản phẩm
export async function getProductList(container, limitCount = 100) {
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);

        allProducts = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));

        renderProductList(container, allProducts);
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm: ", error);
    }
}

// Render danh sách sản phẩm ra giao diện
function renderProductList(container, productList) {
    container.innerHTML = productList
        .map(
            (product) => `
        <div class="product-item col-lg-3 col-sm-4 col-6 d-flex">
            <div class="item-container">
                <figure class="overflow-hidden mb-0" style="border-radius: 8px 8px 0 0;">
                    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
                </figure>
                <div class="content p-3 d-flex flex-column justify-content-between">
                    <h5 class="mb-1 text-uppercase text-center title">${product.name}</h5>
                    <p class="mb-0 text-center mt-auto">Giá: <span class="fs-6 fw-semibold text-danger">${formatter.format(product.price)}</span></p>
                    <button class="btn btn-primary btn-order" data-id="${product.id}">Đặt hàng</button>
                </div>
            </div>
        </div>
    `
        )
        .join("");

    setupOrderButtons();
}

// Gán sự kiện click vào nút Đặt hàng
function setupOrderButtons() {
    document.querySelectorAll(".btn-order").forEach((btn) => {
        btn.onclick = () => {
            checkSession();
            showOrderForm(btn.dataset.id);
        };
    });
}

// Thiết lập tìm kiếm và sắp xếp
export function setupSearchAndSort(searchInputId, sortSelectId, container) {
    const input = document.getElementById(searchInputId);
    const sortSelect = document.getElementById(sortSelectId);
    const clearBtn = document.getElementById("clearInput");

    input.oninput = () => {
        const keyword = input.value.trim().toLowerCase();
        const filtered = allProducts.filter((p) => p.name.toLowerCase().includes(keyword));
        renderProductList(container, filtered);
    };

    clearBtn.onclick = () => {
        input.value = "";
        input.focus();
        sortSelect.value = "";
        renderProductList(container, allProducts);
    };

    sortSelect.onchange = () => {
        let sorted = [...allProducts];
        if (sortSelect.value === "asc") {
            sorted.sort((a, b) => a.price - b.price);
        } else if (sortSelect.value === "desc") {
            sorted.sort((a, b) => b.price - a.price);
        }
        renderProductList(container, sorted);
    };
}

// Hiển thị form đặt hàng
async function showOrderForm(productId) {
    const form = document.querySelector(".order-form");
    form.style.display = "block";

    try {
        const docSnap = await getDoc(doc(db, "products", productId));
        if (!docSnap.exists()) return console.error("Không tìm thấy sản phẩm!");

        const product = docSnap.data();
        form.innerHTML = `
            <div class="content p-3 p-md-2 p-lg-3 bg-light rounded shadow">
                <button class="btn btn-outline-dark btn-cancel">Đóng</button>
                <div class="row">
                    <div class="col-md-5 col-12">
                        <img src="${product.imageUrl}" alt="${product.name}" class="rounded m-sm-0 mb-3">
                    </div>
                    <div class="col-md-7 col-12">
                        <h5>${product.name}</h5>
                        <p class="mb-2 mb-lg-3">Giá: ${formatter.format(product.price)}</p>
                        <form id="order-form">
                            <div class="mb-3 mb-sm-2 mb-lg-3">
                                <label for="quantity" class="form-label">Số lượng</label>
                                <input type="number" class="form-control" id="quantity" value="1" min="1" required>
                            </div>

                            <div class="mb-3">
                                <label for="table-number" class="form-label">Chọn bàn</label>
                                <select class="form-select" id="table-number">
                                    <option value="">-- Chọn bàn --</option>
                                    <option value="1">Bàn 1</option>
                                    <option value="2">Bàn 2</option>
                                    <option value="3">Bàn 3</option>
                                    <option value="4">Bàn 4</option>
                                    <option value="5">Bàn 5</option>
                                </select>
                            </div>

                            <button type="submit" class="btn btn-primary btn-confirm-order w-100"
                                data-price="${product.price}">Xác nhận</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        form.querySelector(".btn-cancel").onclick = () => {
            form.innerHTML = "";
            form.style.display = "none";
        };

        form.querySelector("#order-form").onsubmit = (e) => {
            e.preventDefault();
            const quantity = parseInt(form.querySelector("#quantity").value);
            const price = parseFloat(form.querySelector(".btn-confirm-order").dataset.price);
            const tableNumber = form.querySelector("#table-number").value;
            if (!tableNumber) {
                alert("Vui lòng chọn bàn!");
                return;
            }
            handleOrder(productId, quantity, price, tableNumber);
        };
    } catch (error) {
        console.error("Lỗi khi hiển thị form: ", error);
    }
}

// Xử lý đặt hàng
async function handleOrder(productId, quantity, price, tableNumber) {
    const session = JSON.parse(localStorage.getItem("user_session"));
    if (!session) return alert("Vui lòng đăng nhập để đặt hàng!");

    try {
        const email = session.user.email;
        const q = query(collection(db, "users"), where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return console.log("Không tìm thấy người dùng!");

        const userDoc = snapshot.docs[0];
        const user = userDoc.data();
        const total = quantity * price;

        if (user.balance < total) return alert("Số dư ví không đủ!");

        const productDoc = await getDoc(doc(db, "products", productId));
        await addDoc(collection(db, "orders"), {
            author: email,
            product: productDoc.data(),
            quantity,
            tableNumber,
            status: 0,
            createdAt: new Date(),
        });

        await updateDoc(userDoc.ref, {
            balance: user.balance - total,
        });

        alert("Đặt hàng thành công!");
        document.querySelector(".order-form").style.display = "none";
    } catch (error) {
        console.error("Lỗi đặt hàng: ", error);
    }
}

//<div class="content p-3 p-sm-4 h-100 d-flex flex-column justify-content-between">
//     <div>
//         <figure class="overflow-hidden mb-0" style="border-radius: 8px;">
//             <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
//         </figure>
//         <div class="text p-2 p-sm-3">
//             <div class="d-flex flex-column align-items-center">
//                 <h5 class="mb-1 text-uppercase text-center title">${product.name}</h5>
//                 <p class="mb-0">Giá: <span class="fs-6 fw-semibold text-danger">${formatter.format(product.price)}</span></p>
//             </div>
//         </div>
//     </div>
//     <button class="btn btn-primary btn-order" data-id="${product.id}">Đặt hàng</button>
// </div>
