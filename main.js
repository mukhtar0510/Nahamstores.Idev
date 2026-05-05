// Global variables
let products = JSON.parse(localStorage.getItem('products')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let productReviews = JSON.parse(localStorage.getItem('productReviews')) || [];

// Initialize sample products if empty
function initSampleProducts() {
    if (products.length === 0) {
        products = [
            { id: 101, name: "Premium Non-Stick Fry Pan", category: "cookware", price: 15999, originalPrice: 19999, discount: 20, quantity: 30, description: "Durable ceramic non-stick coating, scratch-resistant surface, even heat distribution.", images: ["https://placehold.co/600x400/6a0dad/white?text=Fry+Pan"], weight: "1.1kg", seller: "Naham Official", sellerPhone: "+234 803 639 3001", rating: 4.7 },
            { id: 102, name: "Stainless Steel Pot Set", category: "cookware", price: 24999, originalPrice: 29999, discount: 16, quantity: 15, description: "3-ply construction, even heat distribution, dishwasher safe.", images: ["https://placehold.co/600x400/4b0082/white?text=Pot+Set"], seller: "Naham Official", sellerPhone: "+234 803 639 3001", rating: 4.5 },
            { id: 103, name: "Professional Chef Knife", category: "cutlery", price: 8999, quantity: 45, description: "High carbon stainless steel, ergonomic handle, ultra-sharp edge.", images: ["https://placehold.co/600x400/ff9900/white?text=Chef+Knife"], seller: "BladeMaster", sellerPhone: "+234 802 345 6789", rating: 4.8 },
            { id: 104, name: "Non-Stick Baking Tray Set", category: "bakeware", price: 5999, quantity: 60, description: "Heavy gauge carbon steel, easy release, dishwasher safe.", images: ["https://placehold.co/600x400/6a0dad/white?text=Baking+Tray"], seller: "Naham Official", rating: 4.3 },
            { id: 105, name: "Wooden Utensil Set", category: "utensils", price: 7999, originalPrice: 9999, discount: 20, quantity: 50, description: "Eco-friendly bamboo, 5-piece set, heat resistant.", images: ["https://placehold.co/600x400/8B4513/white?text=Utensils"], seller: "EcoKitchen", rating: 4.6 }
        ];
        localStorage.setItem('products', JSON.stringify(products));
    }
}

// Update cart count badge
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Add to cart function
function addToCart(productId, quantity = 1) {
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ productId, quantity, addedAt: new Date().toISOString() });
    }
    saveCart();
    showToast('✓ Added to cart!', 'success');
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
    if (window.location.pathname.includes('cart.html')) {
        displayCart();
    }
    showToast('🗑 Removed from cart', 'info');
}

// Update quantity in cart
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    let toast = document.getElementById('toastMsg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastMsg';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.style.backgroundColor = type === 'success' ? '#2ecc71' : '#1f2937';
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

// Get star rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

// Load reviews for a product
function loadReviews(productId) {
    const reviews = productReviews.filter(r => r.productId === productId);
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div class="review-item" style="border-bottom:1px solid #eee; padding:15px 0">
            <div style="display:flex; justify-content:space-between">
                <strong>${review.userName}</strong>
                <small>${new Date(review.date).toLocaleDateString()}</small>
            </div>
            <div style="color:var(--secondary)">${getStarRating(review.rating)}</div>
            <strong>${review.title}</strong>
            <p>${review.text}</p>
        </div>
    `).join('');
}

// Submit review
function submitReview(productId, rating, title, text, userName) {
    const newReview = {
        productId: parseInt(productId),
        rating: parseInt(rating),
        title,
        text,
        userName,
        date: new Date().toISOString()
    };
    productReviews.push(newReview);
    localStorage.setItem('productReviews', JSON.stringify(productReviews));
    showToast('Thank you for your review!', 'success');
}

// Contact seller
function contactSeller(productId, name, email, message) {
    const messages = JSON.parse(localStorage.getItem('sellerMessages')) || [];
    messages.push({
        productId,
        name,
        email,
        message,
        date: new Date().toISOString(),
        status: 'unread'
    });
    localStorage.setItem('sellerMessages', JSON.stringify(messages));
    showToast('Message sent to seller!', 'success');
}

// Initialize
initSampleProducts();
updateCartCount();